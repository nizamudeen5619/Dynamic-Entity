'use strict';

/**
 * demo-node — demonstrates dynamic-entity-server with MongoDB.
 *
 * Features demonstrated:
 * - MongoAdapter with .env MongoDB URI
 * - maskedRoles: ['IT_SUPPORT'] — salary field masked for IT_SUPPORT role
 * - beforeSave / afterSave hooks
 * - Status field migration (text → dropdown) for clients entity
 * - All routes exposed at /api/entities
 *
 * Usage:
 *   cp .env.example .env
 *   npm install
 *   node src/index.js
 */

const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const { dynamicEntityRouter, MongoAdapter } = require('dynamic-entity-server');
const { seed } = require('./seed');

const app = express();
app.use(express.json());

// ─── CORS (dev only) ──────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-user-roles');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ─── MongoDB connection ───────────────────────────────────────────────────
let MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dynamic-entity-demo';
const PORT = parseInt(process.env.PORT || '3001');

// ─── Bootstrap ───────────────────────────────────────────────────────────
const bootstrap = async () => {
  if (process.env.USE_MEMORY_DB === 'true') {
    // eslint-disable-next-line global-require
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    MONGO_URI = mongoServer.getUri();
    // eslint-disable-next-line no-console
    console.log('[demo-node] Starting with IN-MEMORY MongoDB');
  }

  await mongoose.connect(MONGO_URI);
  // eslint-disable-next-line no-console
  console.log('[demo-node] Connected to MongoDB:', MONGO_URI);

  const adapter = new MongoAdapter(mongoose.connection);

  // Seed data on startup
  await seed(adapter);

  // Mount dynamic entity router
  app.use(
    '/api/entities',
    dynamicEntityRouter({
      adapter,
      hooks,
      migrations,
      migrationStrategy: 'graceful',
      maskedRoles: ['IT_SUPPORT'],
      auth,
      logging: true,
    }),
  );

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok', mongo: mongoose.connection.readyState }));

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[demo-node] Server running on http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`[demo-node] Try: GET http://localhost:${PORT}/api/entities/config`);
    // eslint-disable-next-line no-console
    console.log(`[demo-node] Try: GET http://localhost:${PORT}/api/entities/data/clients`);
  });
};

// ─── Hooks ───────────────────────────────────────────────────────────────
const hooks = {
  'clients:beforeSave': async (data, { config }) => {
    // Trim string fields before saving
    for (const field of config.fields || []) {
      if (['text', 'textarea'].includes(field.type) && typeof data[field.id] === 'string') {
        data[field.id] = data[field.id].trim();
      }
    }
    return data;
  },
  'clients:afterSave': async (record) => {
    // eslint-disable-next-line no-console
    console.log('[hook:afterSave] clients record saved:', record._id);
    return record;
  },
};

// ─── Migration: status field text → dropdown ──────────────────────────────
const migrations = {
  clients: {
    fieldMigrations: {
      status: [
        {
          fromVersion: 1,
          toVersion: 2,
          migrate: oldValue => {
            // v1 had free-text status, v2 has dropdown with allowed values
            const normalized = String(oldValue || '').toLowerCase().trim();
            if (['active', 'inactive', 'prospect'].includes(normalized)) return normalized;
            return 'active'; // Default fallback
          },
        },
      ],
    },
  },
};

// ─── Auth middleware — reads x-user-roles header ──────────────────────────
// Demo-only: in production use Keycloak/JWT (ONEHERMES pattern)
const auth = async req => {
  const rolesHeader = req.headers['x-user-roles'] || '';
  const userRoles = rolesHeader
    .split(',')
    .map(r => r.trim())
    .filter(Boolean);
  return { userRoles: userRoles.length ? userRoles : ['viewer'] };
};

bootstrap().catch(err => {
  // eslint-disable-next-line no-console
  console.error('[demo-node] Failed to start:', err);
  process.exit(1);
});
