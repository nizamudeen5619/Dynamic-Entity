'use strict';

/**
 * validate.middleware.js — request validation for write routes.
 *
 * Steps:
 * 1. findConfig(entity) — 404 CONFIG_NOT_FOUND if missing
 * 2. Validate required fields from config against req.body — collect ALL errors (not fail-fast)
 * 3. Check _configVersion if present on req.body:
 *    strict   → 409 MIGRATION_REQUIRED
 *    graceful → set req.body._needsMigration = true, continue
 * 4. Attach config to req.entityConfig
 * 5. next()
 *
 * Known bug from ONEHERMES: never fail-fast on validation — collect all errors in details[].
 */

const ApiError = require('../utils/ApiError');
const { ErrorCodes } = require('../utils/error-codes');

/**
 * @param {import('../adapter/mongo.adapter')} adapter
 * @param {'strict'|'graceful'} migrationStrategy
 * @returns {import('express').RequestHandler}
 */
const validateMiddleware = (adapter, migrationStrategy) => async (req, _res, next) => {
  try {
    const entity = req.params.entity;
    const config = await adapter.findConfig(entity);
    if (!config) {
      throw new ApiError('Entity config not found', 404, ErrorCodes.CONFIG_NOT_FOUND);
    }

    const body = req.body || {};
    const errors = [];

    // Validate required fields — collect all errors (not fail-fast)
    for (const field of config.fields || []) {
      if (field.validators && field.validators.includes('required')) {
        const value = body[field.id];
        const isEmpty = value === undefined || value === null || value === '';
        if (isEmpty) {
          const label = field.label?.en || field.id;
          errors.push(`'${label}' is required`);
        }
      }
    }

    if (errors.length > 0) {
      throw new ApiError('Validation failed', 400, ErrorCodes.VALIDATION_FAILED, errors);
    }

    // Check config version staleness
    if (body._configVersion !== undefined && body._configVersion < config.version) {
      if (migrationStrategy === 'strict') {
        throw new ApiError(
          'Record config version is outdated. Run migration first.',
          409,
          ErrorCodes.MIGRATION_REQUIRED,
        );
      } else {
        // graceful: flag the record and continue
        req.body._needsMigration = true;
      }
    }

    req.entityConfig = config;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validateMiddleware;
