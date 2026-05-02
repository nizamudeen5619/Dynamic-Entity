'use strict';

/**
 * auth.middleware.js — pluggable authentication handler.
 * The consumer supplies their own auth function via options.auth.
 * The function receives (req) and must return an object with userRoles: string[].
 * If no auth function is provided, userRoles defaults to [] (no roles — RBAC still applies).
 *
 * @param {function|undefined} authHandler - async (req) => { userRoles: string[] }
 * @returns {import('express').RequestHandler}
 */
const authMiddleware = authHandler => async (req, _res, next) => {
  try {
    if (typeof authHandler === 'function') {
      const result = await authHandler(req);
      req.userRoles = Array.isArray(result?.userRoles) ? result.userRoles : [];
    } else {
      req.userRoles = [];
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authMiddleware;
