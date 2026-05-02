import { TestBed } from '@angular/core/testing';
import { FieldRegistryService } from './field-registry.service';
import { FIELD_TYPE_REGISTRY } from '../tokens/injection-tokens';
import { TextFieldComponent } from '../field-types/text-field.component';
import { Component } from '@angular/core';

@Component({ template: '' })
class CustomFieldComponent {}

describe('FieldRegistryService', () => {
  let service: FieldRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FieldRegistryService,
        {
          provide: FIELD_TYPE_REGISTRY,
          useValue: new Map([['custom', CustomFieldComponent]])
        }
      ]
    });
    service = TestBed.inject(FieldRegistryService);
  });

  it('should resolve built-in field types', () => {
    const comp = service.resolve('text');
    expect(comp).toBe(TextFieldComponent);
  });

  it('should resolve consumer-provided field types', () => {
    const comp = service.resolve('custom');
    expect(comp).toBe(CustomFieldComponent);
  });

  it('should return null for unknown field types', () => {
    expect(service.resolve('unknown')).toBeNull();
  });

  it('should check existence correctly', () => {
    expect(service.has('text')).toBeTrue();
    expect(service.has('custom')).toBeTrue();
    expect(service.has('unknown')).toBeFalse();
  });
});
