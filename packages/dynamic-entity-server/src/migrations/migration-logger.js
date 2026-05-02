'use strict';

/**
 * MigrationLogger — collects log entries during a bulk migration run.
 * Produces a MigrationSummary at the end.
 */
class MigrationLogger {
  /**
   * @param {string} entity
   */
  constructor(entity) {
    this.entity = entity;
    this._log = [];
  }

  /**
   * Log a successful record migration.
   * @param {string} recordId
   * @param {number} fromVersion
   * @param {number} toVersion
   */
  success(recordId, fromVersion, toVersion) {
    this._log.push({
      entity: this.entity,
      recordId,
      fromVersion,
      toVersion,
      status: 'success',
      migratedAt: new Date().toISOString(),
    });
  }

  /**
   * Log a failed record migration.
   * @param {string} recordId
   * @param {number} fromVersion
   * @param {number} toVersion
   * @param {Error} error
   */
  failure(recordId, fromVersion, toVersion, error) {
    this._log.push({
      entity: this.entity,
      recordId,
      fromVersion,
      toVersion,
      status: 'failed',
      error: error.message,
      migratedAt: new Date().toISOString(),
    });
  }

  /**
   * Produce the MigrationSummary.
   * @returns {import('@dynamic-entity/core').MigrationSummary}
   */
  getSummary() {
    const succeeded = this._log.filter(e => e.status === 'success').length;
    const failed = this._log.filter(e => e.status === 'failed').length;
    return {
      entity: this.entity,
      total: this._log.length,
      succeeded,
      failed,
      log: this._log,
    };
  }
}

module.exports = MigrationLogger;
