'use strict';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const MongoAdapter = require('./mongo.adapter');

describe('MongoAdapter', () => {
  let mongoServer;
  let adapter;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    adapter = new MongoAdapter(mongoose.connection);
  }, 60000);

  beforeEach(async () => {
    // Clear all data collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  it('should save and find an entity config', async () => {
    const config = {
      entity: 'test_entity',
      version: 1,
      fields: [{ id: 'name', type: 'text' }]
    };

    await adapter.saveConfig(config);
    const found = await adapter.findConfig('test_entity');
    
    expect(found).toBeDefined();
    expect(found.entity).toBe('test_entity');
    expect(found.version).toBe(1);
  });

  it('should save and retrieve records with strict:false', async () => {
    const record = {
      name: 'Test Record',
      dynamicField: 'Something extra',
      _configVersion: 1
    };

    const saved = await adapter.saveRecord('test_entity', record);
    expect(saved._id).toBeDefined();
    expect(saved.dynamicField).toBe('Something extra');

    const result = await adapter.findRecords('test_entity', { pageSize: 10 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Test Record');
  });

  it('should handle config history and rollback', async () => {
    const entity = 'history_test';
    await adapter.saveConfig({ entity, fields: [{ id: 'f1' }] });
    
    // Update config to v2
    await adapter.updateConfig(entity, { fields: [{ id: 'f2' }] });
    
    const v2 = await adapter.findConfig(entity);
    expect(v2.version).toBe(2);
    expect(v2.history).toHaveLength(1);
    expect(v2.history[0].version).toBe(1);

    // Rollback to v1
    await adapter.rollbackConfig(entity, 1);
    
    const v3 = await adapter.findConfig(entity);
    expect(v3.version).toBe(3); // Incremented from 2
    expect(v3.fields[0].id).toBe('f1');
    expect(v3.history).toHaveLength(2);
  });

  it('should handle complex filtering and sorting in findRecords', async () => {
    const entity = 'query_test';
    await adapter.saveRecord(entity, { name: 'A', age: 30, _configVersion: 1 });
    await adapter.saveRecord(entity, { name: 'B', age: 20, _configVersion: 1 });
    await adapter.saveRecord(entity, { name: 'C', age: 25, _configVersion: 1 });

    // Filter and Sort
    const result = await adapter.findRecords(entity, {
      filters: { age: { $gt: 22 } },
      sortField: 'age',
      sortDir: 'asc'
    });

    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe('C'); // 25
    expect(result.data[1].name).toBe('A'); // 30
  });

  it('should handle pagination', async () => {
    const entity = 'pag_test';
    for (let i = 0; i < 5; i++) {
      await adapter.saveRecord(entity, { i, _configVersion: 1 });
    }

    const page1 = await adapter.findRecords(entity, { page: 1, pageSize: 2, sortField: 'i', sortDir: 'asc' });
    expect(page1.data).toHaveLength(2);
    expect(page1.pagination.total).toBe(5);
    expect(page1.pagination.totalPages).toBe(3);
    expect(page1.data[0].i).toBe(0);

    const page3 = await adapter.findRecords(entity, { page: 3, pageSize: 2, sortField: 'i', sortDir: 'asc' });
    expect(page3.data).toHaveLength(1);
    expect(page3.data[0].i).toBe(4);
  });

  it('should handle restore and hard delete', async () => {
    const entity = 'delete_test';
    const saved = await adapter.saveRecord(entity, { name: 'X', _configVersion: 1 });
    
    await adapter.softDeleteRecord(entity, saved._id);
    expect((await adapter.findRecords(entity)).data).toHaveLength(0);

    await adapter.restoreRecord(entity, saved._id);
    expect((await adapter.findRecords(entity)).data).toHaveLength(1);

    await adapter.hardDeleteRecord(entity, saved._id);
    const found = await adapter.findRecord(entity, saved._id);
    expect(found).toBeNull();
  });

  it('should perform bulk updates', async () => {
    const entity = 'bulk_test';
    const r1 = await adapter.saveRecord(entity, { n: 1, _configVersion: 1 });
    const r2 = await adapter.saveRecord(entity, { n: 2, _configVersion: 1 });

    await adapter.bulkUpdateRecords(entity, [
      { id: r1._id, data: { n: 10 } },
      { id: r2._id, data: { n: 20 } }
    ]);

    const u1 = await adapter.findRecord(entity, r1._id);
    const u2 = await adapter.findRecord(entity, r2._id);
    expect(u1.n).toBe(10);
    expect(u2.n).toBe(20);
  });

  it('should reuse models from cache', () => {
    const m1 = adapter._getDataModel('cache_test');
    const m2 = adapter._getDataModel('cache_test');
    expect(m1).toBe(m2);
  });

  it('should throw if connection is missing', () => {
    expect(() => new MongoAdapter(null)).toThrow('MongoAdapter requires a mongoose connection instance');
  });

  it('should handle $or filtering for search', async () => {
    const entity = 'search_test';
    await adapter.saveRecord(entity, { firstName: 'Alice', lastName: 'A', _configVersion: 1 });
    await adapter.saveRecord(entity, { firstName: 'Bob', lastName: 'B', _configVersion: 1 });

    const result = await adapter.findRecords(entity, {
      filters: { 
        $or: [
          { firstName: { $regex: 'Alice', $options: 'i' } },
          { lastName: { $regex: 'Alice', $options: 'i' } }
        ]
      }
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].firstName).toBe('Alice');
  });

  it('should return empty pagination for no records', async () => {
    const result = await adapter.findRecords('empty_test');
    expect(result.data).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });
});

