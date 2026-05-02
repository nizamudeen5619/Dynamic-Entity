'use strict';

/**
 * rbac.utils.js — ALL RBAC and masking logic lives here.
 * ADR-003: 3-level OR resolution — Form.maskData || Tab.maskData || Field.maskData
 *
 * CRITICAL SYNC RULE: This file and Angular's RbacService must implement
 * identical masking logic at all times. Change one = change both in the same commit.
 */

const ApiError = require('./ApiError');
const { ErrorCodes } = require('./error-codes');

const MASKED_VALUE = 'XXXXXXXXX';

/**
 * Check if any of the user's roles appear in the required roles list.
 * hasPermission(roles, undefined) → true (no restriction).
 *
 * @param {string[]} userRoles
 * @param {string[]} requiredRoles
 * @returns {boolean}
 */
const hasPermission = (userRoles = [], requiredRoles = []) => {
  if (!requiredRoles.length) return true;
  return userRoles.some(role => requiredRoles.includes(role));
};

/**
 * ADR-003: Resolve the effective mask flag from 3 levels using OR logic.
 * Must match RbacService.resolveEffectiveMask() in Angular exactly.
 *
 * @param {boolean|undefined} formMask
 * @param {boolean|undefined} tabMask
 * @param {boolean|undefined} fieldMask
 * @returns {boolean}
 */
const resolveEffectiveMask = (formMask, tabMask, fieldMask) => !!(formMask || tabMask || fieldMask);

/**
 * Check if the user has a masked role (i.e. should see XXXXXXXXX).
 *
 * @param {string[]} userRoles
 * @param {string[]} maskedRoles
 * @returns {boolean}
 */
const isUserMaskedRole = (userRoles = [], maskedRoles = []) => maskedRoles.some(r => userRoles.includes(r));

/**
 * Determine if a specific field should be masked for this user.
 *
 * @param {import('@dynamic-entity/core').FieldConfig} field
 * @param {import('@dynamic-entity/core').TabConfig|undefined} tab
 * @param {import('@dynamic-entity/core').EntityConfig} config
 * @param {string[]} userRoles
 * @param {string[]} maskedRoles
 * @returns {boolean}
 */
const shouldMaskField = (field, tab, config, userRoles, maskedRoles) => {
  if (!isUserMaskedRole(userRoles, maskedRoles)) return false;
  return resolveEffectiveMask(config.maskData, tab?.maskData, field.maskData);
};

/**
 * Apply field masking to a record. Returns a new object — never mutates.
 * Called on every read response (defense-in-depth).
 *
 * @param {object} record - Plain record object
 * @param {import('@dynamic-entity/core').EntityConfig} config
 * @param {string[]} userRoles
 * @param {string[]} maskedRoles
 * @returns {object}
 */
const applyFieldMask = (record, config, userRoles, maskedRoles) => {
  const masked = { ...record };
  for (const field of config.fields || []) {
    const tab = (config.tabs || []).find(t => t.id === field.tab);
    if (shouldMaskField(field, tab, config, userRoles, maskedRoles)) {
      masked[field.id] = MASKED_VALUE;
    }
  }
  return masked;
};

/**
 * Higher level permission check that throws ApiError.
 *
 * @param {import('@dynamic-entity/core').EntityConfig} config
 * @param {string[]} userRoles
 * @param {'view'|'edit'|'delete'} action
 * @throws {ApiError}
 */
const checkPermission = (config, userRoles, action) => {
  if (!userRoles || userRoles.length === 0) {
    throw new ApiError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED);
  }

  const requiredRoles = config.permissions?.[action] || [];
  if (!hasPermission(userRoles, requiredRoles)) {
    throw new ApiError(`Forbidden: ${action} access denied`, 403, ErrorCodes.FORBIDDEN);
  }
};

module.exports = {
  MASKED_VALUE,
  hasPermission,
  resolveEffectiveMask,
  isUserMaskedRole,
  shouldMaskField,
  applyFieldMask,
  checkPermission,
};
