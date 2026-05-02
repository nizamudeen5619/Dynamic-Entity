import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CheckboxFieldComponent } from './checkbox-field.component';
import { FieldConfig } from '@dynamic-entity/core';

describe('CheckboxFieldComponent', () => {
  let component: CheckboxFieldComponent;
  let fixture: ComponentFixture<CheckboxFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckboxFieldComponent, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CheckboxFieldComponent);
    component = fixture.componentInstance;
    component.field = { label: { en: 'Active' } } as any;
    component.control = new FormControl(true);
    fixture.detectChanges();
  });

  it('should render checked input', () => {
    const input = fixture.nativeElement.querySelector('input');
    expect(input.type).toBe('checkbox');
    expect(input.checked).toBeTrue();
  });

  it('should render Yes/No in readonly mode', () => {
    component.readonly = true;
    fixture.detectChanges();
    const val = fixture.nativeElement.querySelector('.ngx-field__value');
    expect(val.textContent).toBe('Yes');
    
    component.control.setValue(false);
    fixture.detectChanges();
    expect(val.textContent).toBe('No');
  });
});
