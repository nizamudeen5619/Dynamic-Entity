'use strict';

/**
 * index.js — public API for dynamic-entity-server.
 * DIP: routes receive adapter via options, never instantiate MongoAdapter directly.
 * This is the ONLY file consumers interact with — never change or remove option names.
 *
 * Usage:
 *   const { dynamicEntityRouter, MongoAdapter } = require('dynamic-entity-server');
 *
 *   const adapter = new MongoAdapter(mongoose.connection);
 *   app.use('/api/entities', dynamicEntityRouter({ adapter, maskedRoles: ['IT_SUPPORT'] }));
 */

const express = require('express');
const MongoAdapter = require('./src/adapter/mongo.adapter');
const HookRegistry = require('./src/hooks/hook-registry');
const MigrationRegistry = require('./src/migrations/migration-registry');
const loggerMiddleware = require('./src/middleware/logger.middleware');
const authMiddleware = require('./src/middleware/auth.middleware');
const errorHandler = require('./src/middleware/error-handler');
const configRoutes = require('./src/routes/config.routes');
const dataRoutes = require('./src/routes/data.routes');
const migrationRoutes = require('./src/routes/migration.routes');

/**
 * Factory function — creates a fully-configured Express router.
 * DIP: adapter injected via options, never imported directly in routes.
 *
 * @param {object} options
 * @param {import('./src/adapter/mongo.adapter')} options.adapter - MongoAdapter or any DynamicEntityAdapter implementation
 * @param {Record<string, Function>} [options.hooks] - Hook functions keyed by '{entity}:beforeSave', etc.
 * @param {Record<string, object>} [options.migrations] - EntityMigration definitions keyed by entity name
 * @param {'strict'|'graceful'|'auto'} [options.migrationStrategy='graceful'] - How to handle stale records on write
 * @param {string[]} [options.maskedRoles=[]] - Roles that see XXXXXXXXX for masked fields (ADR-003)
 * @param {function} [options.auth] - async (req) => { userRoles: string[] }
 * @param {boolean} [options.logging=true] - Enable request/response logging
 * @returns {import('express').Router}
 */
const dynamicEntityRouter = (options = {}) => {
  if (!options.adapter) {
    throw new Error('dynamicEntityRouter requires options.adapter — pass a MongoAdapter or DynamicEntityAdapter instance');
  }

  const router = express.Router();

  // Build registries from options
  const hookRegistry = new HookRegistry();
  Object.entries(options.hooks || {}).forEach(([key, fn]) => hookRegistry.register(key, fn));

  const migrationRegistry = new MigrationRegistry();
  Object.entries(options.migrations || {}).forEach(([entity, migration]) =>
    migrationRegistry.register(entity, migration),
  );

  const routeOptions = {
    adapter: options.adapter,
    hookRegistry,
    migrationRegistry,
    migrationStrategy: options.migrationStrategy || 'graceful',
    maskedRoles: options.maskedRoles || [],
  };

  // Middleware — order matters
  if (options.logging !== false) router.use(loggerMiddleware);
  router.use(authMiddleware(options.auth));

  // Mount route groups
  router.use('/config', configRoutes(routeOptions));
  router.use('/data', dataRoutes(routeOptions));
  router.use('/migrate', migrationRoutes(routeOptions));

  // Global error handler — must be last
  router.use(errorHandler);

  return router;
};

module.exports = { dynamicEntityRouter, MongoAdapter };
