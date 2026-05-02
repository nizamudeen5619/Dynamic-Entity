'use strict';

/**
 * HookRegistry — stores and runs pre/post hooks per entity.
 * Open/Closed: open for extension via register(), closed for modification.
 * Fluent API for chaining.
 */
class HookRegistry {
  constructor() {
    this._registry = new Map();
  }

  /**
   * Register a hook function for a key.
   * @param {string} key - e.g. 'beforeSave', 'afterSave', 'beforeDelete'
   * @param {function} fn - async (data, context) => data
   * @returns {HookRegistry} this (fluent)
   */
  register(key, fn) {
    this._registry.set(key, fn);
    return this;
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this._registry.has(key);
  }

  /**
   * Run a hook. Returns data unchanged if no hook registered for key.
   * @param {string} key
   * @param {any} data
   * @param {object} [context={}]
   * @returns {Promise<any>}
   */
  async run(key, data, context = {}) {
    const hook = this._registry.get(key);
    if (!hook) return data;
    return hook(data, context);
  }
}

module.exports = HookRegistry;
