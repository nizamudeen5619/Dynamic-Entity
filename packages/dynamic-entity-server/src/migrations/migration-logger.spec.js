'use strict';

const MigrationLogger = require('./migration-logger');

describe('MigrationLogger', () => {
  let logger;

  beforeEach(() => {
    logger = new MigrationLogger('test');
  });

  it('should collect success logs', () => {
    logger.success('id1', 1, 2);
    const summary = logger.getSummary();
    expect(summary.total).toBe(1);
    expect(summary.succeeded).toBe(1);
    expect(summary.log[0].status).toBe('success');
  });

  it('should collect failure logs', () => {
    logger.failure('id2', 1, 2, new Error('Boom'));
    const summary = logger.getSummary();
    expect(summary.total).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.log[0].error).toBe('Boom');
  });

  it('should produce correct totals', () => {
    logger.success('1', 1, 2);
    logger.failure('2', 1, 2, new Error('X'));
    const summary = logger.getSummary();
    expect(summary.total).toBe(2);
    expect(summary.succeeded).toBe(1);
    expect(summary.failed).toBe(1);
  });
});
