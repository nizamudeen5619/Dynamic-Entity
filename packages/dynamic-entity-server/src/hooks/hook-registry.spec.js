'use strict';

const HookRegistry = require('./hook-registry');

describe('HookRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new HookRegistry();
  });

  it('should register and run a simple hook', async () => {
    registry.register('test:beforeSave', async (data) => {
      return { ...data, modified: true };
    });

    const result = await registry.run('test:beforeSave', { name: 'John' });
    expect(result.modified).toBe(true);
    expect(result.name).toBe('John');
  });

  it('should return data unchanged if no hook is registered', async () => {
    const data = { name: 'John' };
    const result = await registry.run('nonexistent', data);
    expect(result).toBe(data);
  });

  it('should pass context to the hook', async () => {
    registry.register('test:beforeSave', async (data, context) => {
      return { ...data, user: context.user };
    });

    const result = await registry.run('test:beforeSave', { name: 'John' }, { user: 'admin' });
    expect(result.user).toBe('admin');
  });

  it('should support fluent registration', () => {
    const r = registry
      .register('a', () => {})
      .register('b', () => {});
    
    expect(r).toBe(registry);
    expect(registry.has('a')).toBe(true);
    expect(registry.has('b')).toBe(true);
  });

  it('should handle async side effects in hooks', async () => {
    let sideEffect = false;
    registry.register('test:afterSave', async (data) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      sideEffect = true;
      return data;
    });

    await registry.run('test:afterSave', { id: 1 });
    expect(sideEffect).toBe(true);
  });
});
