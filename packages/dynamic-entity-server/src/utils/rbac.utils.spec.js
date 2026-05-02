'use strict';

const { resolveEffectiveMask, checkPermission, isUserMaskedRole, applyFieldMask } = require('./rbac.utils');
const ApiError = require('./ApiError');
const { ErrorCodes } = require('../../../core/dist/index'); // use built core

describe('rbac.utils', () => {
  describe('resolveEffectiveMask', () => {
    it('should return false if no masks are set', () => {
      expect(resolveEffectiveMask(false, false, false)).toBe(false);
      expect(resolveEffectiveMask(undefined, null, undefined)).toBe(false);
    });

    it('should return true if field mask is set', () => {
      expect(resolveEffectiveMask(false, false, true)).toBe(true);
    });

    it('should return true if tab mask is set', () => {
      expect(resolveEffectiveMask(false, true, false)).toBe(true);
    });

    it('should return true if form mask is set', () => {
      expect(resolveEffectiveMask(true, false, false)).toBe(true);
    });

    it('should return true if multiple masks are set (OR logic)', () => {
      expect(resolveEffectiveMask(true, true, true)).toBe(true);
      expect(resolveEffectiveMask(true, false, true)).toBe(true);
    });
  });

  describe('checkPermission', () => {
    const config = {
      permissions: {
        view: ['user', 'admin'],
        edit: ['admin'],
        delete: ['owner']
      }
    };

    it('should pass if user has required role', () => {
      expect(() => checkPermission(config, ['user'], 'view')).not.toThrow();
      expect(() => checkPermission(config, ['admin'], 'edit')).not.toThrow();
    });

    it('should pass if no roles are required (empty array)', () => {
      const openConfig = { permissions: { view: [] } };
      expect(() => checkPermission(openConfig, ['anyone'], 'view')).not.toThrow();
    });

    it('should throw FORBIDDEN if user lacks required role', () => {
      try {
        checkPermission(config, ['user'], 'edit');
        throw new Error('Should have failed');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe(ErrorCodes.FORBIDDEN);
      }
    });

    it('should throw UNAUTHORIZED if user has no roles', () => {
      try {
        checkPermission(config, [], 'view');
        throw new Error('Should have failed');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe(ErrorCodes.UNAUTHORIZED);
      }
    });
  });

  describe('isUserMaskedRole', () => {
    it('should return true if any role is masked', () => {
      expect(isUserMaskedRole(['IT_SUPPORT'], ['IT_SUPPORT', 'AUDITOR'])).toBe(true);
    });

    it('should return false if no roles are masked', () => {
      expect(isUserMaskedRole(['admin'], ['IT_SUPPORT'])).toBe(false);
    });
  });

  describe('applyFieldMask', () => {
    const config = {
      maskData: false,
      fields: [
        { id: 'name', type: 'text', maskData: false },
        { id: 'salary', type: 'number', maskData: true }
      ]
    };
    const userRoles = ['staff'];
    const maskedRoles = ['staff'];

    it('should mask specific fields and leave others', () => {
      const record = { name: 'John', salary: 1000 };
      const masked = applyFieldMask(record, config, userRoles, maskedRoles);
      expect(masked.name).toBe('John');
      expect(masked.salary).toBe('XXXXXXXXX');
    });

    it('should NOT mask if user is not in maskedRoles', () => {
      const record = { name: 'John', salary: 1000 };
      const masked = applyFieldMask(record, config, ['admin'], maskedRoles);
      expect(masked.salary).toBe(1000);
    });
  });
});
