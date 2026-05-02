import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DynamicFormComponent } from './dynamic-form.component';
import { ValidatorRegistryService } from '../services/validator-registry.service';
import { HookRegistryService } from '../services/hook-registry.service';
import { VersionService } from '../services/version.service';
import { RbacService } from '../services/rbac.service';
import { EntityConfig } from '@dynamic-entity/core';
import { SimpleChange } from '@angular/core';

describe('DynamicFormComponent', () => {
  let component: DynamicFormComponent;
  let fixture: ComponentFixture<DynamicFormComponent>;
  let mockValidatorRegistry: any;
  let mockHookRegistry: any;
  let mockVersionService: any;
  let mockRbacService: any;

  const mockConfig: EntityConfig = {
    entity: 'clients',
    version: 1,
    fields: [
      { id: 'name', type: 'text', validators: ['required'], defaultValue: 'Default' },
      { id: 'age', type: 'number' }
    ],
    tabs: [
      { id: 'tab1', label: { en: 'Tab 1' }, order: 1 },
      { id: 'tab2', label: { en: 'Tab 2' }, order: 2 }
    ]
  } as any;

  beforeEach(async () => {
    mockValidatorRegistry = { resolveAll: vi.fn().mockReturnValue([]) };
    mockHookRegistry = { run: vi.fn().mockImplementation((_k, d) => Promise.resolve(d)) };
    mockVersionService = { 
      needsMigration: vi.fn().mockReturnValue(false),
      shouldBlockSubmit: vi.fn().mockReturnValue(false)
    };
    mockRbacService = { getPermissions: vi.fn().mockReturnValue({ canEdit: true }) };

    await TestBed.configureTestingModule({
      imports: [DynamicFormComponent, ReactiveFormsModule],
      providers: [
        { provide: ValidatorRegistryService, useValue: mockValidatorRegistry },
        { provide: HookRegistryService, useValue: mockHookRegistry },
        { provide: VersionService, useValue: mockVersionService },
        { provide: RbacService, useValue: mockRbacService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.config = mockConfig;
    fixture.detectChanges();
  });

  it('should build form based on config', () => {
    expect(component.form).toBeDefined();
    expect(component.form.get('name')).toBeDefined();
    expect(component.form.get('name')?.value).toBe('Default');
  });

  it('should patch form with initial data', () => {
    component.ngOnChanges({
      initialData: new SimpleChange(null, { name: 'John', age: 30 }, true)
    });
    expect(component.form.get('name')?.value).toBe('John');
    expect(component.form.get('age')?.value).toBe(30);
  });

  it('should identify active tab and filter fields', () => {
    component.config.fields![0].tab = 'tab1';
    component.config.fields![1].tab = 'tab2';
    
    component.setActiveTab('tab1');
    expect(component.fieldsForActiveTab.length).toBe(1);
    expect(component.fieldsForActiveTab[0].id).toBe('name');

    component.setActiveTab('tab2');
    expect(component.fieldsForActiveTab[0].id).toBe('age');
  });

  it('should handle submission with hooks', async () => {
    const spy = vi.spyOn(component.formSubmit, 'emit');
    component.form.patchValue({ name: 'Submit Test' });
    
    await component.submit();
    
    expect(mockHookRegistry.run).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ name: 'Submit Test' }));
  });

  it('should block submit if VersionService says so (strict mode)', () => {
    mockVersionService.shouldBlockSubmit.mockReturnValue(true);
    expect(component.canSubmit).toBeFalse();
  });

    component.isSaving.set(true);
    expect(component.canSubmit).toBeFalse();
  });

  it('should not submit if form is invalid', async () => {
    component.form.get('name')?.setValue(''); // Required field
    const spy = vi.spyOn(component.formSubmit, 'emit');
    await component.submit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should sort tabs by order', () => {
    expect(component.tabs[0].id).toBe('tab1');
    expect(component.tabs[1].id).toBe('tab2');
  });

  it('should emit restore events', () => {
    const spy = vi.spyOn(component.formRestore, 'emit');
    component.restore();
    expect(spy).toHaveBeenCalled();
  });
});
