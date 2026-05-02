'use strict';

/**
 * error-codes.js — re-exports ErrorCodes from @dynamic-entity/core.
 * This keeps server code from importing TypeScript directly.
 * Use these constants in ApiError constructor and route responses.
 */

// In CommonJS context: @dynamic-entity/core is built to CJS via tsup
const { ErrorCodes } = require('@dynamic-entity/core');

module.exports = { ErrorCodes };
