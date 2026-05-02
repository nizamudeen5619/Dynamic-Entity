'use strict';

/**
 * mongo.adapter.js — implements DynamicEntityAdapter using Mongoose.
 * ADR-002: strict: false on all data schemas.
 * ADR-007: No multi-tenancy — single connection per adapter instance.
 * Indexes created on model init, never lazily.
 * All queries use .lean() (returns plain objects — faster, matches conventions).
 * bulkWrite() used for batch operations — never loops (gotcha #4 from ONEHERMES).
 */

const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { ErrorCodes } = require('../utils/error-codes');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const CONFIG_COLLECTION = 'entity_configs';

// Model cache — one Mongoose model per entity per adapter instance
// Keyed by `${connectionId}:${entity}` to support multiple adapter instances
const modelCache = new Map();

/**
 * Config schema — strict shape, known fields.
 * Not strict:false because config structure is well-defined.
 */
const configSchema = new mongoose.Schema(
  {
    entity: { type: String, required: true, unique: true, index: true },
    version: { type: Number, required: true, default: 1 },
    fields: { type: Array, default: [] },
    tabs: { type: Array, default: [] },
    hooks: { type: Object, default: null },
    defaultLanguage: { type: String, default: 'en' },
    history: { type: Array, default: [] },
    maskData: { type: Boolean, default: false },
    permissions: { type: Object, default: null },
  },
  { timestamps: true },
);

class MongoAdapter {
  /**
   * @param {mongoose.Connection} connection - Active Mongoose connection
   * @param {object} [options={}]
   * @param {string} [options.configCollection='entity_configs'] - Override config collection name
   */
  constructor(connection, options = {}) {
    if (!connection) throw new Error('MongoAdapter requires a mongoose connection instance');
    this._conn = connection;
    this._connId = connection.id ?? Math.random().toString(36).slice(2);
    this._configCollectionName = options.configCollection || CONFIG_COLLECTION;

    // Register config model on this connection
    this._ConfigModel = this._getOrCreateModel(
      '__config__',
      configSchema,
      this._configCollectionName,
    );
  }

  /**
   * Get or create a Mongoose model on this connection.
   * Prevents OverwriteModelError on hot reload.
   *
   * @param {string} cacheKey
   * @param {mongoose.Schema} schema
   * @param {string} collectionName
   * @returns {mongoose.Model}
   */
  _getOrCreateModel(cacheKey, schema, collectionName) {
    const key = `${this._connId}:${cacheKey}`;
    if (modelCache.has(key)) return modelCache.get(key);

    // Use connection.model() — not global mongoose.model() (ADR-007 no multi-tenancy imposed)
    const modelName = `DynEntity_${collectionName}`;
    let model;
    try {
      model = this._conn.model(modelName);
    } catch (_) {
      model = this._conn.model(modelName, schema, collectionName);
    }

    modelCache.set(key, model);
    return model;
  }

  /**
   * Get the Mongoose model for an entity's data collection.
   * ADR-002: strict:false. System fields declared explicitly for index creation.
   * Indexes created at model init — not lazily.
   *
   * @param {string} entity
   * @returns {mongoose.Model}
   */
  _getDataModel(entity) {
    const collectionName = `entity_data_${entity}`;

    const schema = new mongoose.Schema(
      {
        _configVersion: { type: Number, required: true },
        _needsMigration: { type: Boolean, default: false },
        _deletedAt: { type: Date, default: null },
      },
      { strict: false, timestamps: true },
    );

    // Indexes created at model init — not on first query
    schema.index({ _configVersion: 1 });
    schema.index({ _needsMigration: 1 });
    schema.index({ _deletedAt: 1 });
    schema.index({ createdAt: -1 });

    return this._getOrCreateModel(entity, schema, collectionName);
  }

  // ─── Config CRUD ──────────────────────────────────────────────────────────

  /**
   * @param {string} entity
   * @returns {Promise<import('@dynamic-entity/core').EntityConfig|null>}
   */
  async findConfig(entity) {
    return this._ConfigModel.findOne({ entity }).lean();
  }

  /**
   * @returns {Promise<import('@dynamic-entity/core').EntityConfig[]>}
   */
  async listConfigs() {
    return this._ConfigModel.find().lean();
  }

  /**
   * Create a new entity config. Sets version:1 and history:[].
   * @param {import('@dynamic-entity/core').EntityConfig} config
   * @returns {Promise<import('@dynamic-entity/core').EntityConfig>}
   */
  async saveConfig(config) {
    const doc = await this._ConfigModel.create({ ...config, version: 1, history: [] });
    return doc.toObject();
  }

  /**
   * Update entity config: increment version, push snapshot to history.
   * @param {string} entity
   * @param {Partial<import('@dynamic-entity/core').EntityConfig>} updates
   * @returns {Promise<import('@dynamic-entity/core').EntityConfig>}
   */
  async updateConfig(entity, updates) {
    const existing = await this._ConfigModel.findOne({ entity }).lean();
    if (!existing) {
      throw new ApiError('Config not found', 404, ErrorCodes.CONFIG_NOT_FOUND);
    }

    // Capture current version as a snapshot before overwriting
    const snapshot = {
      version: existing.version,
      fields: existing.fields,
      changedAt: new Date().toISOString(),
    };

    const updated = await this._ConfigModel.findOneAndUpdate(
      { entity },
      {
        ...updates,
        version: existing.version + 1,
        $push: { history: snapshot },
      },
      { new: true },
    ).lean();

    return updated;
  }

  /**
   * @param {string} entity
   * @returns {Promise<void>}
   */
  async deleteConfig(entity) {
    await this._ConfigModel.deleteOne({ entity });
  }

  /**
   * @param {string} entity
   * @returns {Promise<import('@dynamic-entity/core').EntityConfigSnapshot[]>}
   */
  async getConfigHistory(entity) {
    const config = await this._ConfigModel.findOne({ entity }, { history: 1 }).lean();
    if (!config) throw new ApiError('Config not found', 404, ErrorCodes.CONFIG_NOT_FOUND);
    return config.history || [];
  }

  /**
   * Rollback to a previous config version by restoring fields from history snapshot.
   * @param {string} entity
   * @param {number} version
   * @returns {Promise<import('@dynamic-entity/core').EntityConfig>}
   */
  async rollbackConfig(entity, version) {
    const config = await this._ConfigModel.findOne({ entity }).lean();
    if (!config) throw new ApiError('Config not found', 404, ErrorCodes.CONFIG_NOT_FOUND);

    const snapshot = (config.history || []).find(h => h.version === version);
    if (!snapshot) {
      throw new ApiError(`Version ${version} not found in history`, 404, ErrorCodes.INVALID_CONFIG_VERSION);
    }

    return this.updateConfig(entity, { fields: snapshot.fields });
  }

  // ─── Data CRUD ────────────────────────────────────────────────────────────

  /**
   * Find records with pagination, sorting, search, and soft-delete filtering.
   * Search is applied by the caller via options.filters (routes extract string fields from config).
   *
   * @param {string} entity
   * @param {import('@dynamic-entity/core').QueryOptions} [options={}]
   * @returns {Promise<import('@dynamic-entity/core').PaginatedResult>}
   */
  async findRecords(entity, options = {}) {
    const Model = this._getDataModel(entity);
    const page = Math.max(1, parseInt(options.page) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(options.pageSize) || DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * pageSize;

    // Build filter — exclude soft-deleted by default
    const filter = {};
    if (!options.includeDeleted) filter._deletedAt = null;
    if (options.filters && typeof options.filters === 'object') {
      Object.assign(filter, options.filters);
    }

    const sort = {};
    if (options.sortField) {
      sort[options.sortField] = options.sortDir === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    // Run count and data query in parallel — confirmed pattern from ONEHERMES architecture_patterns
    const [data, total] = await Promise.all([
      Model.find(filter).sort(sort).skip(skip).limit(pageSize).lean(),
      Model.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 0,
      },
    };
  }

  /**
   * @param {string} entity
   * @param {string} id
   * @returns {Promise<import('@dynamic-entity/core').VersionedRecord|null>}
   */
  async findRecord(entity, id) {
    const Model = this._getDataModel(entity);
    return Model.findById(id).lean();
  }

  /**
   * Create a new data record.
   * @param {string} entity
   * @param {object} data - Must include _configVersion
   * @returns {Promise<import('@dynamic-entity/core').VersionedRecord>}
   */
  async saveRecord(entity, data) {
    const Model = this._getDataModel(entity);
    const doc = await Model.create(data);
    return doc.toObject();
  }

  /**
   * Update an existing data record by ID.
   * @param {string} entity
   * @param {string} id
   * @param {object} data
   * @returns {Promise<import('@dynamic-entity/core').VersionedRecord>}
   */
  async updateRecord(entity, id, data) {
    const Model = this._getDataModel(entity);
    const doc = await Model.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    if (!doc) throw new ApiError('Record not found', 404, ErrorCodes.RECORD_NOT_FOUND);
    return doc;
  }

  /**
   * Soft delete — sets _deletedAt to now. Default delete behaviour.
   * @param {string} entity
   * @param {string} id
   * @returns {Promise<void>}
   */
  async softDeleteRecord(entity, id) {
    const Model = this._getDataModel(entity);
    const result = await Model.findByIdAndUpdate(id, { $set: { _deletedAt: new Date() } });
    if (!result) throw new ApiError('Record not found', 404, ErrorCodes.RECORD_NOT_FOUND);
  }

  /**
   * Restore a soft-deleted record.
   * @param {string} entity
   * @param {string} id
   * @returns {Promise<import('@dynamic-entity/core').VersionedRecord>}
   */
  async restoreRecord(entity, id) {
    const Model = this._getDataModel(entity);
    const doc = await Model.findByIdAndUpdate(id, { $set: { _deletedAt: null } }, { new: true }).lean();
    if (!doc) throw new ApiError('Record not found', 404, ErrorCodes.RECORD_NOT_FOUND);
    return doc;
  }

  /**
   * Permanently delete a record. Requires explicit /hard route (ADR-002).
   * @param {string} entity
   * @param {string} id
   * @returns {Promise<void>}
   */
  async hardDeleteRecord(entity, id) {
    const Model = this._getDataModel(entity);
    const result = await Model.findByIdAndDelete(id);
    if (!result) throw new ApiError('Record not found', 404, ErrorCodes.RECORD_NOT_FOUND);
  }

  // ─── Migration ────────────────────────────────────────────────────────────

  /**
   * Find all non-deleted records that are flagged for migration.
   * @param {string} entity
   * @returns {Promise<import('@dynamic-entity/core').VersionedRecord[]>}
   */
  async findRecordsNeedingMigration(entity) {
    const Model = this._getDataModel(entity);
    return Model.find({ _needsMigration: true, _deletedAt: null }).lean();
  }

  /**
   * Batch update records. Uses bulkWrite() — never loops.
   * ONEHERMES gotcha #4: loop + individual update = performance disaster.
   *
   * @param {string} entity
   * @param {Array<{ id: string, data: object }>} updates
   * @returns {Promise<void>}
   */
  async bulkUpdateRecords(entity, updates) {
    if (!updates.length) return;
    const Model = this._getDataModel(entity);
    await Model.bulkWrite(
      updates.map(({ id, data }) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: data },
        },
      })),
    );
  }
}

module.exports = MongoAdapter;
