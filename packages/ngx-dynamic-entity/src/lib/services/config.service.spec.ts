import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConfigService } from './config.service';
import { DYNAMIC_ENTITY_API_URL } from '../tokens/injection-tokens';
import { EntityConfig } from '@dynamic-entity/core';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://api.test';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ConfigService,
        { provide: DYNAMIC_ENTITY_API_URL, useValue: apiUrl }
      ]
    });
    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch config and cache it via shareReplay', () => {
    const mockConfig = { entity: 'clients', version: 1 } as EntityConfig;
    
    service.getConfig('clients').subscribe(config => {
      expect(config).toEqual(mockConfig);
    });

    const req = httpMock.expectOne(`${apiUrl}/config/clients`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockConfig });

    // Second call should NOT trigger another request (cached)
    service.getConfig('clients').subscribe();
    httpMock.expectNone(`${apiUrl}/config/clients`);
  });

  it('should list all configs', () => {
    const mockConfigs = [{ entity: 'a' }, { entity: 'b' }] as any[];
    
    service.listConfigs().subscribe(configs => {
      expect(configs).toEqual(mockConfigs);
    });

    const req = httpMock.expectOne(`${apiUrl}/config`);
    req.flush({ success: true, data: mockConfigs });
  });

    service.getConfig('clients').subscribe();
    httpMock.expectOne(`${apiUrl}/config/clients`);
  });

  it('should handle API error responses gracefully', () => {
    service.getConfig('missing').subscribe({
      error: (err) => {
        expect(err).toBeDefined();
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/config/missing`);
    req.flush(
      { success: false, error: { message: 'Not Found', code: 'CONFIG_NOT_FOUND' } },
      { status: 404, statusText: 'Not Found' }
    );
  });
});
