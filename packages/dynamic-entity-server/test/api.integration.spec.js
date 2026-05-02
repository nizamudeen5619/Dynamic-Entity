'use strict';

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { dynamicEntityRouter, MongoAdapter } = require('../index');

describe('API Integration', () => {
  let mongoServer;
  let adapter;
  let app;

  const CLIENTS_ENTITY = 'clients';

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    adapter = new MongoAdapter(mongoose.connection);
    
    app = express();
    app.use(express.json());
    
    app.use('/api', dynamicEntityRouter({
      adapter,
      auth: async (req) => {
        const roles = req.headers['x-roles'] ? req.headers['x-roles'].split(',') : ['viewer'];
        return { userRoles: roles };
      },
      maskedRoles: ['IT_SUPPORT']
    }));

    // Seed config
    await adapter.saveConfig({
      entity: CLIENTS_ENTITY,
      version: 1,
      fields: [
        { id: 'firstName', type: 'text', tableColumn: true },
        { id: 'salary', type: 'number', maskData: true, tableColumn: true }
      ],
      permissions: {
        view: [],
        edit: ['admin']
      }
    });

    // Seed data
    await adapter.saveRecord(CLIENTS_ENTITY, {
      firstName: 'John',
      salary: 50000,
      _configVersion: 1
    });
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  it('should return masked data for IT_SUPPORT role', async () => {
    const res = await request(app)
      .get(`/api/data/${CLIENTS_ENTITY}`)
      .set('x-roles', 'IT_SUPPORT');

    expect(res.status).toBe(200);
    expect(res.body.data[0].salary).toBe('XXXXXXXXX');
  });

  it('should handle config history and rollback', async () => {
    // Update config
    await request(app)
      .put(`/api/config/${CLIENTS_ENTITY}`)
      .send({ fields: [{ id: 'firstName', type: 'text' }, { id: 'salary', type: 'number' }, { id: 'age', type: 'number' }] });

    const historyRes = await request(app).get(`/api/config/${CLIENTS_ENTITY}/history`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data).toHaveLength(1);

    const rollbackRes = await request(app).post(`/api/config/${CLIENTS_ENTITY}/rollback/1`);
    expect(rollbackRes.status).toBe(200);
    expect(rollbackRes.body.data.version).toBe(3);
  });

  it('should handle search functionality', async () => {
    await request(app)
      .post(`/api/data/${CLIENTS_ENTITY}`)
      .set('x-roles', 'admin')
      .send({ firstName: 'Alice', salary: 10, _configVersion: 1 });

    const searchRes = await request(app).get(`/api/data/${CLIENTS_ENTITY}?search=Alice`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.some(r => r.firstName === 'Alice')).toBe(true);
  });

  it('should return 404 for missing config', async () => {
    const res = await request(app).get('/api/data/nonexistent');
    expect(res.status).toBe(404);
  });

  it('should return 403 for unauthorized edit', async () => {
    const res = await request(app)
      .post(`/api/data/${CLIENTS_ENTITY}`)
      .set('x-roles', 'viewer')
      .send({ firstName: 'Hacker' });
    expect(res.status).toBe(403);
  });
});
