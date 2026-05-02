'use strict';

const MigrationRegistry = require('./migration-registry');

describe('MigrationRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new MigrationRegistry();
  });

  it('should register and retrieve migrations', () => {
    const migration = { fromVersion: 1, toVersion: 2, fields: [] };
    registry.register('test', migration);
    expect(registry.get('test')).toBe(migration);
    expect(registry.has('test')).toBe(true);
  });

  it('should return undefined for missing migrations', () => {
    expect(registry.get('missing')).toBeUndefined();
    expect(registry.has('missing')).toBe(false);
  });

  it('should support fluent API', () => {
    const r = registry.register('a', {}).register('b', {});
    expect(r).toBe(registry);
    expect(registry.has('a')).toBe(true);
    expect(registry.has('b')).toBe(true);
  });
});
