import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicTableComponent } from './dynamic-table.component';
import { RbacService } from '../services/rbac.service';
import { VersionService } from '../services/version.service';
import { EntityConfig } from '@dynamic-entity/core';
import { SimpleChange } from '@angular/core';

describe('DynamicTableComponent', () => {
  let component: DynamicTableComponent;
  let fixture: ComponentFixture<DynamicTableComponent>;
  let mockRbacService: any;
  let mockVersionService: any;

  const mockConfig: EntityConfig = {
    entity: 'clients',
    version: 1,
    fields: [
      { id: 'name', type: 'text', tableColumn: true, label: { en: 'Name' } },
      { id: 'salary', type: 'number', tableColumn: true, label: { en: 'Salary' } }
    ],
    permissions: { view: [], edit: ['admin'], delete: ['admin'] }
  } as any;

  beforeEach(async () => {
    mockRbacService = {
      getPermissions: vi.fn().mockReturnValue({ canView: true, canEdit: true, canDelete: true }),
      shouldMaskField: vi.fn().mockReturnValue(false)
    };
    mockVersionService = {
      needsMigration: vi.fn().mockReturnValue(false)
    };

    await TestBed.configureTestingModule({
      imports: [DynamicTableComponent],
      providers: [
        { provide: RbacService, useValue: mockRbacService },
        { provide: VersionService, useValue: mockVersionService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicTableComponent);
    component = fixture.componentInstance;
    component.config = mockConfig;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve table columns from config', () => {
    expect(component.tableColumns().length).toBe(2);
    expect(component.tableColumns()[0].id).toBe('name');
  });

  it('should apply masking via RbacService', () => {
    mockRbacService.shouldMaskField.mockReturnValue(true);
    component.ngOnChanges({
      config: new SimpleChange(null, mockConfig, true)
    });
    
    const value = component.getCellValue({ name: 'John', salary: 5000 } as any, 'salary');
    expect(value).toBe('XXXXXXXXX');
  });

  it('should emit sort events', () => {
    const spy = vi.spyOn(component.sortChange, 'emit');
    component.onSort('name');
    expect(spy).toHaveBeenCalledWith({ field: 'name', dir: 'asc' });
    
    component.onSort('name'); // Toggle
    expect(spy).toHaveBeenCalledWith({ field: 'name', dir: 'desc' });
  });

  it('should calculate total pages correctly', () => {
    component.totalRecords = 50;
    component.pageSize = 20;
    expect(component.totalPages).toBe(3);
  });

    mockVersionService.needsMigration.mockReturnValue(true);
    expect(component.needsMigration({ name: 'Old' } as any)).toBeTrue();
  });

  it('should emit page change events', () => {
    const spy = vi.spyOn(component.pageChange, 'emit');
    component.onPageChange(2);
    expect(spy).toHaveBeenCalledWith(2);
  });

  it('should return 0 total pages for 0 records', () => {
    component.totalRecords = 0;
    expect(component.totalPages).toBe(0);
  });

  it('should format labels correctly', () => {
    component.language = 'en';
    const col = { label: { en: 'Name', fr: 'Nom' } } as any;
    expect(component.getColLabel(col)).toBe('Name');
  });
});
