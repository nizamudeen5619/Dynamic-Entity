'use strict';

/**
 * MigrationRegistry — stores EntityMigration definitions per entity.
 * Open/Closed: open for new entity migrations, closed for modification.
 */
class MigrationRegistry {
  constructor() {
    this._registry = new Map();
  }

  /**
   * Register a migration definition for an entity.
   * @param {string} entity
   * @param {import('@dynamic-entity/core').EntityMigration} migration
   * @returns {MigrationRegistry} this (fluent)
   */
  register(entity, migration) {
    this._registry.set(entity, migration);
    return this;
  }

  /**
   * Get migration definition for an entity.
   * @param {string} entity
   * @returns {import('@dynamic-entity/core').EntityMigration|undefined}
   */
  get(entity) {
    return this._registry.get(entity);
  }

  /**
   * @param {string} entity
   * @returns {boolean}
   */
  has(entity) {
    return this._registry.has(entity);
  }
}

module.exports = MigrationRegistry;
