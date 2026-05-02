'use strict';

/**
 * data.routes.js — Express router for /data/:entity
 * The most complex route file. Integrates: adapter, hookRegistry, rbac.utils, validateMiddleware.
 *
 * Routes:
 *   GET    /data/:entity              → findRecords (paginated, masked)
 *   GET    /data/:entity/:id          → findRecord (404 if missing, masked)
 *   POST   /data/:entity              → RBAC(edit) → pre hook → validate → saveRecord → post hook
 *   PUT    /data/:entity/:id          → RBAC(edit) → pre hook → validate → updateRecord → post hook
 *   DELETE /data/:entity/:id          → RBAC(delete) → softDeleteRecord
 *   POST   /data/:entity/:id/restore  → restoreRecord
 *   DELETE /data/:entity/:id/hard     → RBAC(delete) → hardDeleteRecord
 *
 * Query params on GET /:entity:
 *   page, pageSize (max 100), sortField, sortDir, search, filters (JSON), includeDeleted
 *
 * RBAC: req.userRoles attached by auth.middleware
 * Masking: applyFieldMask on every read response
 */

const express = require('express');
const ApiError = require('../utils/ApiError');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response.utils');
const { ErrorCodes } = require('../utils/error-codes');
const { hasPermission, applyFieldMask } = require('../utils/rbac.utils');
const validateMiddleware = require('../middleware/validate.middleware');

/**
 * @param {{
 *   adapter: import('../adapter/mongo.adapter'),
 *   hookRegistry: import('../hooks/hook-registry'),
 *   migrationStrategy: 'strict'|'graceful',
 *   maskedRoles: string[],
 * }} options
 * @returns {import('express').Router}
 */
const dataRoutes = options => {
  const { adapter, hookRegistry, migrationStrategy, maskedRoles } = options;
  const router = express.Router({ mergeParams: true });

  // ─── RBAC check helper — throws 403 if user lacks required permission ────
  const checkPermission = (config, userRoles, permissionType) => {
    const required = config.permissions?.[permissionType] || [];
    if (!hasPermission(userRoles, required)) {
      throw new ApiError('Forbidden', 403, ErrorCodes.FORBIDDEN);
    }
  };

  // ─── Mask helper — applies field masking on read responses ───────────────
  const maskRecord = (record, config, req) => applyFieldMask(record, config, req.userRoles || [], maskedRoles);

  // ─── Validation middleware factory for write routes ──────────────────────
  const validate = validateMiddleware(adapter, migrationStrategy);

  // GET /data/:entity — list records (paginated, masked)
  router.get('/:entity', async (req, res, next) => {
    try {
      const config = await adapter.findConfig(req.params.entity);
      if (!config) {
        return sendError(res, ErrorCodes.CONFIG_NOT_FOUND, 'Entity config not found', [], 404);
      }

      // RBAC view check
      checkPermission(config, req.userRoles || [], 'view');

      // Build query options from query params
      const { page, pageSize, sortField, sortDir, search, filters, includeDeleted } = req.query;
      const queryOptions = {
        page,
        pageSize,
        sortField,
        sortDir,
        includeDeleted: includeDeleted === 'true',
      };

      // Parse filters JSON (safe parse)
      if (filters) {
        try {
          queryOptions.filters = JSON.parse(filters);
        } catch (_) {
          throw new ApiError('filters must be a valid JSON string', 400, ErrorCodes.VALIDATION_FAILED);
        }
      }

      // Build search filter from string-type fields — applied at route layer (SRP: adapter doesn't know field types)
      if (search && search.trim()) {
        const searchTerm = search.trim();
        const stringFields = (config.fields || []).filter(
          f => ['text', 'textarea'].includes(f.type) && !f.isSystem,
        );
        if (stringFields.length > 0) {
          const searchOr = stringFields.map(f => ({
            [f.id]: { $regex: searchTerm, $options: 'i' },
          }));
          queryOptions.filters = { ...queryOptions.filters, $or: searchOr };
        }
      }

      const result = await adapter.findRecords(req.params.entity, queryOptions);

      // Mask all records in the result
      const maskedData = result.data.map(r => maskRecord(r, config, req));

      sendPaginated(res, maskedData, result.pagination, 'Records retrieved');
    } catch (err) {
      next(err);
    }
  });

  // GET /data/:entity/:id — single record (masked)
  router.get('/:entity/:id', async (req, res, next) => {
    try {
      const config = await adapter.findConfig(req.params.entity);
      if (!config) {
        return sendError(res, ErrorCodes.CONFIG_NOT_FOUND, 'Entity config not found', [], 404);
      }
      checkPermission(config, req.userRoles || [], 'view');

      const record = await adapter.findRecord(req.params.entity, req.params.id);
      if (!record) {
        return sendError(res, ErrorCodes.RECORD_NOT_FOUND, 'Record not found', [], 404);
      }

      sendSuccess(res, maskRecord(record, config, req), 'Record retrieved');
    } catch (err) {
      next(err);
    }
  });

  // POST /data/:entity — create record
  router.post('/:entity', validate, async (req, res, next) => {
    try {
      const config = req.entityConfig;
      checkPermission(config, req.userRoles || [], 'edit');

      // Run pre hook — may transform data
      const data = await hookRegistry.run(`${req.params.entity}:beforeSave`, req.body, { req, config });

      // Ensure system versioning fields are set
      data._configVersion = config.version;
      data._needsMigration = data._needsMigration || false;
      data._deletedAt = null;

      const record = await adapter.saveRecord(req.params.entity, data);

      // Run post hook
      await hookRegistry.run(`${req.params.entity}:afterSave`, record, { req, config });

      sendSuccess(res, maskRecord(record, config, req), 'Record created', 201);
    } catch (err) {
      next(err);
    }
  });

  // PUT /data/:entity/:id — update record
  router.put('/:entity/:id', validate, async (req, res, next) => {
    try {
      const config = req.entityConfig;
      checkPermission(config, req.userRoles || [], 'edit');

      const existing = await adapter.findRecord(req.params.entity, req.params.id);
      if (!existing) {
        return sendError(res, ErrorCodes.RECORD_NOT_FOUND, 'Record not found', [], 404);
      }

      const data = await hookRegistry.run(`${req.params.entity}:beforeSave`, req.body, { req, config, existing });

      // Update version bookkeeping
      data._configVersion = config.version;

      const record = await adapter.updateRecord(req.params.entity, req.params.id, data);

      await hookRegistry.run(`${req.params.entity}:afterSave`, record, { req, config });

      sendSuccess(res, maskRecord(record, config, req), 'Record updated');
    } catch (err) {
      next(err);
    }
  });

  // DELETE /data/:entity/:id — soft delete
  router.delete('/:entity/:id', async (req, res, next) => {
    try {
      const config = await adapter.findConfig(req.params.entity);
      if (!config) {
        return sendError(res, ErrorCodes.CONFIG_NOT_FOUND, 'Entity config not found', [], 404);
      }
      checkPermission(config, req.userRoles || [], 'delete');

      await adapter.softDeleteRecord(req.params.entity, req.params.id);
      sendSuccess(res, null, 'Record deleted');
    } catch (err) {
      next(err);
    }
  });

  // POST /data/:entity/:id/restore — restore soft-deleted record
  router.post('/:entity/:id/restore', async (req, res, next) => {
    try {
      const config = await adapter.findConfig(req.params.entity);
      if (!config) {
        return sendError(res, ErrorCodes.CONFIG_NOT_FOUND, 'Entity config not found', [], 404);
      }
      const record = await adapter.restoreRecord(req.params.entity, req.params.id);
      sendSuccess(res, maskRecord(record, config, req), 'Record restored');
    } catch (err) {
      next(err);
    }
  });

  // DELETE /data/:entity/:id/hard — permanent delete
  router.delete('/:entity/:id/hard', async (req, res, next) => {
    try {
      const config = await adapter.findConfig(req.params.entity);
      if (!config) {
        return sendError(res, ErrorCodes.CONFIG_NOT_FOUND, 'Entity config not found', [], 404);
      }
      checkPermission(config, req.userRoles || [], 'delete');

      await adapter.hardDeleteRecord(req.params.entity, req.params.id);
      sendSuccess(res, null, 'Record permanently deleted');
    } catch (err) {
      next(err);
    }
  });

  return router;
};

module.exports = dataRoutes;
