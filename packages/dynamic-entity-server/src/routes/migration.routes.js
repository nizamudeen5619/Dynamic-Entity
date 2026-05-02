'use strict';

/**
 * migration.routes.js — Express router for /migrate
 *
 * Routes:
 *   GET  /migrate/:entity/status → count records needing migration
 *   POST /migrate/:entity        → run bulk migration → MigrationSummary
 */

const express = require('express');
const { sendSuccess, sendError } = require('../utils/response.utils');
const { ErrorCodes } = require('../utils/error-codes');
const { bulkMigrate } = require('../migrations/migration-runner');

/**
 * @param {{
 *   adapter: import('../adapter/mongo.adapter'),
 *   migrationRegistry: import('../migrations/migration-registry'),
 * }} options
 * @returns {import('express').Router}
 */
const migrationRoutes = options => {
  const { adapter, migrationRegistry } = options;
  const router = express.Router();

  // GET /migrate/:entity/status — count pending migrations
  router.get('/:entity/status', async (req, res, next) => {
    try {
      const config = await adapter.findConfig(req.params.entity);
      if (!config) {
        return sendError(res, ErrorCodes.CONFIG_NOT_FOUND, 'Entity config not found', [], 404);
      }
      const pending = await adapter.findRecordsNeedingMigration(req.params.entity);
      sendSuccess(res, { entity: req.params.entity, pendingCount: pending.length }, 'Migration status retrieved');
    } catch (err) {
      next(err);
    }
  });

  // POST /migrate/:entity — run bulk migration
  router.post('/:entity', async (req, res, next) => {
    try {
      const config = await adapter.findConfig(req.params.entity);
      if (!config) {
        return sendError(res, ErrorCodes.CONFIG_NOT_FOUND, 'Entity config not found', [], 404);
      }
      const summary = await bulkMigrate(req.params.entity, adapter, config, migrationRegistry);
      sendSuccess(res, summary, 'Migration complete');
    } catch (err) {
      next(err);
    }
  });

  return router;
};

module.exports = migrationRoutes;
