import { TestBed } from '@angular/core/testing';
import { ValidatorRegistryService } from './validator-registry.service';
import { VALIDATOR_REGISTRY } from '../tokens/injection-tokens';
import { Validators } from '@angular/forms';

describe('ValidatorRegistryService', () => {
  let service: ValidatorRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ValidatorRegistryService,
        {
          provide: VALIDATOR_REGISTRY,
          useValue: new Map([['custom', () => ({ custom: true })]])
        }
      ]
    });
    service = TestBed.inject(ValidatorRegistryService);
  });

  it('should resolve built-in required validator', () => {
    const v = service.resolve('required');
    expect(v).toBe(Validators.required);
  });

  it('should resolve parameterized built-in minLength', () => {
    const v = service.resolve('minLength:5');
    expect(v).toBeDefined();
    // Test the validator function
    const result = v!({ value: 'abc' } as any);
    expect(result?.['minlength']).toBeDefined();
  });

  it('should resolve consumer-provided custom validator', () => {
    const v = service.resolve('custom');
    expect(v).toBeDefined();
    expect(v!({} as any)).toEqual({ custom: true });
  });

  it('should return null for unknown validator', () => {
    expect(service.resolve('unknown')).toBeNull();
  });

  it('should resolve multiple validators', () => {
    const vs = service.resolveAll(['required', 'custom', 'unknown']);
    expect(vs.length).toBe(2);
  });

  it('should resolve min and max validators', () => {
    expect(service.resolve('min:10')).toBeDefined();
    expect(service.resolve('max:100')).toBeDefined();
  });

  it('should resolve maxLength validator', () => {
    expect(service.resolve('maxLength:10')).toBeDefined();
  });

  it('should return null for invalid parameters', () => {
    expect(service.resolve('min:abc')).toBeNull();
    expect(service.resolve('minLength:')).toBeNull();
  });
});
