'use strict';

/**
 * migration-runner.js — core migration execution logic.
 * migrateRecord: applies all relevant FieldMigration[] in version order for a single record.
 * bulkMigrate: runs migration for all flagged records of an entity, batches updates via bulkWrite.
 */

const MigrationLogger = require('./migration-logger');

/**
 * Migrate a single record from its current _configVersion to the target config version.
 * For each field: finds FieldMigration[] where fromVersion <= record._configVersion < toVersion.
 * Runs migrations in ascending toVersion order.
 *
 * @param {import('@dynamic-entity/core').VersionedRecord} record
 * @param {import('@dynamic-entity/core').EntityConfig} config
 * @param {import('@dynamic-entity/core').EntityMigration} entityMigration
 * @returns {object} migrated record data (plain object, not saved)
 */
const migrateRecord = (record, config, entityMigration) => {
  const result = { ...record };
  const currentVersion = record._configVersion;

  for (const [fieldId, fieldMigrations] of Object.entries(entityMigration.fieldMigrations || {})) {
    // Collect and sort all relevant migrations in ascending order of their toVersion
    const applicable = fieldMigrations
      .filter(m => m.fromVersion >= currentVersion && m.toVersion <= config.version)
      .sort((a, b) => a.toVersion - b.toVersion);

    for (const migration of applicable) {
      result[fieldId] = migration.migrate(result[fieldId]);
    }
  }

  result._configVersion = config.version;
  result._needsMigration = false;

  return result;
};

/**
 * Run bulk migration for all records of an entity that are flagged _needsMigration: true.
 * Successful records are batch-updated via bulkUpdateRecords (never loops — ONEHERMES gotcha #4).
 *
 * @param {string} entity
 * @param {import('../adapter/mongo.adapter')} adapter
 * @param {import('@dynamic-entity/core').EntityConfig} config
 * @param {import('./migration-registry')} registry
 * @returns {Promise<import('@dynamic-entity/core').MigrationSummary>}
 */
const bulkMigrate = async (entity, adapter, config, registry) => {
  const logger = new MigrationLogger(entity);
  const entityMigration = registry.get(entity);

  if (!entityMigration) {
    // No migration registered — mark all as current version without field transforms
    const records = await adapter.findRecordsNeedingMigration(entity);
    const updates = records.map(r => ({
      id: r._id.toString(),
      data: { _configVersion: config.version, _needsMigration: false },
    }));
    await adapter.bulkUpdateRecords(entity, updates);
    records.forEach(r => logger.success(r._id.toString(), r._configVersion, config.version));
    return logger.getSummary();
  }

  const records = await adapter.findRecordsNeedingMigration(entity);
  const successUpdates = [];

  for (const record of records) {
    const fromVersion = record._configVersion;
    try {
      const migrated = migrateRecord(record, config, entityMigration);
      successUpdates.push({ id: record._id.toString(), data: migrated });
      logger.success(record._id.toString(), fromVersion, config.version);
    } catch (err) {
      logger.failure(record._id.toString(), fromVersion, config.version, err);
    }
  }

  // Batch all successful updates in one bulkWrite — never one-by-one
  await adapter.bulkUpdateRecords(entity, successUpdates);

  return logger.getSummary();
};

module.exports = { migrateRecord, bulkMigrate };
