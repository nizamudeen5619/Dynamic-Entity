'use strict';

/**
 * config.routes.js — Express router for /config
 * Handles entity config CRUD and versioning.
 * All responses via sendSuccess() — never raw res.json() (ADR-004).
 * All errors via ApiError + next(err) — never raw res.status(500) (ONEHERMES convention).
 *
 * Routes:
 *   GET    /                          → listConfigs
 *   GET    /:entity                   → findConfig (404 if missing)
 *   GET    /:entity/history           → getConfigHistory
 *   POST   /                          → saveConfig (version:1, history:[])
 *   PUT    /:entity                   → updateConfig (increment version, push to history)
 *   DELETE /:entity                   → deleteConfig
 *   POST   /:entity/rollback/:version → rollbackConfig
 */

const express = require('express');
const ApiError = require('../utils/ApiError');
const { sendSuccess, sendError } = require('../utils/response.utils');
const { ErrorCodes } = require('../utils/error-codes');

/**
 * @param {{ adapter: import('../adapter/mongo.adapter') }} options
 * @returns {import('express').Router}
 */
const configRoutes = options => {
  const { adapter } = options;
  const router = express.Router();

  // GET / — list all entity configs
  router.get('/', async (_req, res, next) => {
    try {
      const configs = await adapter.listConfigs();
      sendSuccess(res, configs, 'Configs retrieved');
    } catch (err) {
      next(err);
    }
  });

  // GET /:entity/history — must come before /:entity to avoid shadowing
  router.get('/:entity/history', async (req, res, next) => {
    try {
      const history = await adapter.getConfigHistory(req.params.entity);
      sendSuccess(res, history, 'Config history retrieved');
    } catch (err) {
      next(err);
    }
  });

  // POST /:entity/rollback/:version — must come before /:entity
  router.post('/:entity/rollback/:version', async (req, res, next) => {
    try {
      const version = parseInt(req.params.version);
      if (isNaN(version) || version < 1) {
        throw new ApiError('Invalid version number', 400, ErrorCodes.INVALID_CONFIG_VERSION);
      }
      const config = await adapter.rollbackConfig(req.params.entity, version);
      sendSuccess(res, config, `Config rolled back to version ${version}`);
    } catch (err) {
      next(err);
    }
  });

  // GET /:entity — find single config
  router.get('/:entity', async (req, res, next) => {
    try {
      const config = await adapter.findConfig(req.params.entity);
      if (!config) {
        return sendError(res, ErrorCodes.CONFIG_NOT_FOUND, 'Entity config not found', [], 404);
      }
      sendSuccess(res, config, 'Config retrieved');
    } catch (err) {
      next(err);
    }
  });

  // POST / — create new config
  router.post('/', async (req, res, next) => {
    try {
      const { entity } = req.body;
      if (!entity) {
        throw new ApiError('entity field is required', 400, ErrorCodes.VALIDATION_FAILED, ['entity is required']);
      }
      const existing = await adapter.findConfig(entity);
      if (existing) {
        throw new ApiError(`Config for '${entity}' already exists`, 409, ErrorCodes.VALIDATION_FAILED);
      }
      const config = await adapter.saveConfig(req.body);
      sendSuccess(res, config, 'Config created', 201);
    } catch (err) {
      next(err);
    }
  });

  // PUT /:entity — update config
  router.put('/:entity', async (req, res, next) => {
    try {
      const config = await adapter.updateConfig(req.params.entity, req.body);
      sendSuccess(res, config, 'Config updated');
    } catch (err) {
      next(err);
    }
  });

  // DELETE /:entity
  router.delete('/:entity', async (req, res, next) => {
    try {
      await adapter.deleteConfig(req.params.entity);
      sendSuccess(res, null, 'Config deleted');
    } catch (err) {
      next(err);
    }
  });

  return router;
};

module.exports = configRoutes;
