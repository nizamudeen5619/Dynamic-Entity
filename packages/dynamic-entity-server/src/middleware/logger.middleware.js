'use strict';

/**
 * logger.middleware.js — request/response logging.
 * Logs method, URL, status, and duration for every request.
 * Minimal and self-contained — no downstream dependencies.
 */

/** @param {import('express').Request} req @param {import('express').Response} res @param {Function} next */
const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // eslint-disable-next-line no-console
    console.log(`[dynamic-entity] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
};

module.exports = loggerMiddleware;
