import { TestBed } from '@angular/core/testing';
import { RbacService } from './rbac.service';
import { MASKED_ROLES } from '../tokens/injection-tokens';
import { EntityConfig, FieldConfig, TabConfig } from '@dynamic-entity/core';

describe('RbacService', () => {
  let service: RbacService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RbacService,
        { provide: MASKED_ROLES, useValue: ['IT_SUPPORT', 'AUDITOR'] }
      ]
    });
    service = TestBed.inject(RbacService);
  });

  it('should resolve effective mask with 3-level OR logic', () => {
    expect(service.resolveEffectiveMask(true, false, false)).toBeTrue();
    expect(service.resolveEffectiveMask(false, true, false)).toBeTrue();
    expect(service.resolveEffectiveMask(false, false, true)).toBeTrue();
    expect(service.resolveEffectiveMask(false, false, false)).toBeFalse();
  });

  it('should correctly identify masked roles', () => {
    expect(service.isUserMaskedRole(['admin', 'IT_SUPPORT'])).toBeTrue();
    expect(service.isUserMaskedRole(['viewer'])).toBeFalse();
  });

  it('should only mask fields if user has masked role', () => {
    const config = { maskData: true } as EntityConfig;
    const field = { id: 'test' } as FieldConfig;
    
    // Admin has permission, but is NOT a masked role
    expect(service.shouldMaskField(field, undefined, config, ['admin'])).toBeFalse();
    
    // IT_SUPPORT is a masked role and config says maskData: true
    expect(service.shouldMaskField(field, undefined, config, ['IT_SUPPORT'])).toBeTrue();
  });

  it('should return correct permission object', () => {
    const config = {
      permissions: {
        view: [],
        edit: ['admin'],
        delete: ['admin', 'super']
      }
    } as EntityConfig;

    const adminPerms = service.getPermissions(config, ['admin']);
    expect(adminPerms.canView).toBeTrue();
    expect(adminPerms.canEdit).toBeTrue();
    expect(adminPerms.canDelete).toBeTrue();

    const viewerPerms = service.getPermissions(config, ['viewer']);
    expect(viewerPerms.canView).toBeTrue();
    expect(viewerPerms.canEdit).toBeFalse();
    expect(viewerPerms.canDelete).toBeFalse();
  });
});
