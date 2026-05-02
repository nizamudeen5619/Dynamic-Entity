'use strict';

/**
 * error-handler.js — global Express error handler. Mounted last in index.js.
 * Handles ApiError instances with correct status codes.
 * All other errors become 500 INTERNAL_ERROR.
 * Never change the error response shape — consumers parse it.
 * ADR-004: { success: false, error: { code, message, details } }
 */

const ApiError = require('../utils/ApiError');

/** @type {import('express').ErrorRequestHandler} */
const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details || [],
      },
    });
  }

  // Unknown error — log and return generic 500
  // eslint-disable-next-line no-console
  console.error('[dynamic-entity] Unhandled error:', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: [],
    },
  });
};

module.exports = errorHandler;
