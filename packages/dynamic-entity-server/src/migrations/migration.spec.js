'use strict';

const { migrateRecord } = require('./migration-runner');

describe('Migration Runner', () => {
  const config = { version: 3 };

  it('should handle basic single-step migration', () => {
    const record = { status: 'active', _configVersion: 1 };
    const entityMigrationBasic = {
      fieldMigrations: {
        status: [
          { fromVersion: 1, toVersion: 2, migrate: (val) => val.toUpperCase() }
        ]
      }
    };
    const result = migrateRecord(record, { version: 2 }, entityMigrationBasic);
    expect(result.status).toBe('ACTIVE');
    expect(result._configVersion).toBe(2);
  });

  it('should handle complex multi-step migrations', () => {
    const record = { status: 'active', _configVersion: 1 };
    const localMigration = {
      fieldMigrations: {
        status: [
          { fromVersion: 1, toVersion: 2, migrate: (val) => val.toUpperCase() },
          { fromVersion: 2, toVersion: 3, migrate: (val) => `[${val}]` },
        ]
      }
    };
    const result = migrateRecord(record, config, localMigration);
    expect(result.status).toBe('[ACTIVE]');
    expect(result._configVersion).toBe(3);
  });

  it('should handle intermediate jumps', () => {
    const record = { age: '25', _configVersion: 1 };
    const localMigration = {
      fieldMigrations: {
        age: [{ fromVersion: 1, toVersion: 3, migrate: (val) => Number(val) }]
      }
    };
    const result = migrateRecord(record, config, localMigration);
    expect(result.age).toBe(25);
  });

  it('should mark record as not needing migration after completion', () => {
    const record = { _configVersion: 1, _needsMigration: true };
    const result = migrateRecord(record, config, { fieldMigrations: {} });
    expect(result._needsMigration).toBe(false);
  });

  it('should throw if a field migration fails', () => {
    const record = { status: 'ok', _configVersion: 1 };
    const failingMigration = {
      fieldMigrations: {
        status: [{
          fromVersion: 1,
          toVersion: 2,
          migrate: () => { throw new Error('Boom'); }
        }]
      }
    };
    expect(() => migrateRecord(record, { version: 2 }, failingMigration)).toThrow('Boom');
  });
});

const { bulkMigrate } = require('./migration-runner');

describe('Bulk Migration Error Handling', () => {
  let mockAdapter;
  let mockRegistry;

  beforeEach(() => {
    mockAdapter = {
      findRecordsNeedingMigration: vi.fn(),
      bulkUpdateRecords: vi.fn().mockResolvedValue()
    };
    mockRegistry = { get: vi.fn() };
  });

  it('should track failures and continue for other records', async () => {
    const entityMigration = {
      fieldMigrations: {
        status: [{
          fromVersion: 1,
          toVersion: 2,
          migrate: (v) => { if (!v) throw new Error('Missing val'); return v; }
        }]
      }
    };
    mockRegistry.get.mockReturnValue(entityMigration);
    mockAdapter.findRecordsNeedingMigration.mockResolvedValue([
      { _id: 'fail', status: null, _configVersion: 1 },
      { _id: 'pass', status: 'ok', _configVersion: 1 }
    ]);

    const summary = await bulkMigrate('test', mockAdapter, { version: 2 }, mockRegistry);
    
    expect(summary.failed).toBe(1);
    expect(summary.succeeded).toBe(1);
    expect(mockAdapter.bulkUpdateRecords).toHaveBeenCalledWith('test', expect.arrayContaining([
      expect.objectContaining({ id: 'pass' })
    ]));
  });
});
