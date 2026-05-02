import { TestBed } from '@angular/core/testing';
import { VersionService } from './version.service';
import { MIGRATION_STRATEGY } from '../tokens/injection-tokens';
import { EntityConfig } from '@dynamic-entity/core';

describe('VersionService', () => {
  let service: VersionService;

  describe('with default strategy (graceful)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [VersionService]
      });
      service = TestBed.inject(VersionService);
    });

    it('should identify stale record', () => {
      const config = { version: 2 } as EntityConfig;
      expect(service.needsMigration({ _configVersion: 1 }, config)).toBeTrue();
    });

    it('should identify record flagged for migration', () => {
      const config = { version: 2 } as EntityConfig;
      expect(service.needsMigration({ _configVersion: 2, _needsMigration: true }, config)).toBeTrue();
    });

    it('should NOT block submit in graceful mode', () => {
      const config = { version: 2 } as EntityConfig;
      expect(service.shouldBlockSubmit({ _configVersion: 1 }, config)).toBeFalse();
    });
  });

  describe('with strict strategy', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          VersionService,
          { provide: MIGRATION_STRATEGY, useValue: 'strict' }
        ]
      });
      service = TestBed.inject(VersionService);
    });

    it('should block submit in strict mode if stale', () => {
      const config = { version: 2 } as EntityConfig;
      expect(service.shouldBlockSubmit({ _configVersion: 1 }, config)).toBeTrue();
    });

    it('should allow submit in strict mode if current', () => {
      const config = { version: 2 } as EntityConfig;
      expect(service.shouldBlockSubmit({ _configVersion: 2 }, config)).toBeFalse();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({ providers: [VersionService] });
      service = TestBed.inject(VersionService);
    });

    it('should handle missing _configVersion (assume fresh/ignore)', () => {
      const config = { version: 5 } as EntityConfig;
      expect(service.needsMigration({}, config)).toBeFalse();
    });

    it('should return graceful for invalid strategy token', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          VersionService,
          { provide: MIGRATION_STRATEGY, useValue: 'invalid' as any }
        ]
      });
      service = TestBed.inject(VersionService);
      expect(service.getStrategy()).toBe('graceful');
    });
  });
});
