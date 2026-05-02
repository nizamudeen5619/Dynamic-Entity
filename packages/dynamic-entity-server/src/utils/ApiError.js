'use strict';

/**
 * ApiError — custom error class for all route and service errors.
 * Used by error-handler.js to format the response correctly.
 * Never change the constructor signature after other files use it.
 *
 * @extends Error
 */
class ApiError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [code='INTERNAL_ERROR'] - Machine-readable error code from ErrorCodes
   * @param {string[]} [details=[]] - Array of validation or detail messages
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

module.exports = ApiError;
