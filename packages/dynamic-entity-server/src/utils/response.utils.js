'use strict';

/**
 * response.utils.js — ALL API responses go through these helpers.
 * Never call res.json() directly in routes. This is the public API contract shape.
 * ADR-004: { success, data, message } / { success, data, pagination } / { success, error }
 */

/**
 * Send a successful single-record response.
 * @param {import('express').Response} res
 * @param {object} data
 * @param {string} [message='Success']
 * @param {number} [statusCode=200]
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, data, message });

/**
 * Send a successful paginated list response.
 * @param {import('express').Response} res
 * @param {any[]} data
 * @param {{ page: number, pageSize: number, total: number, totalPages: number }} pagination
 * @param {string} [message='Success']
 */
const sendPaginated = (res, data, pagination, message = 'Success') =>
  res.json({ success: true, data, pagination, message });

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} code - ErrorCode constant
 * @param {string} message - Human-readable message
 * @param {string[]} [details=[]]
 * @param {number} [statusCode=400]
 */
const sendError = (res, code, message, details = [], statusCode = 400) =>
  res.status(statusCode).json({ success: false, error: { code, message, details } });

module.exports = { sendSuccess, sendPaginated, sendError };
