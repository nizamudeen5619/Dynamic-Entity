import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateFieldComponent } from './date-field.component';

describe('DateFieldComponent', () => {
  let component: DateFieldComponent;
  let fixture: ComponentFixture<DateFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateFieldComponent, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(DateFieldComponent);
    component = fixture.componentInstance;
    component.field = { label: { en: 'DOB' } } as any;
    component.control = new FormControl('2020-01-01');
    fixture.detectChanges();
  });

  it('should render date input', () => {
    const input = fixture.nativeElement.querySelector('input');
    expect(input.type).toBe('date');
  });

  it('should format date in readonly mode', () => {
    component.readonly = true;
    fixture.detectChanges();
    const val = fixture.nativeElement.querySelector('.ngx-field__value');
    expect(val.textContent).toContain('2020');
  });

  it('should return default dash for empty date', () => {
    expect(component.formatDate(null)).toBe('—');
  });
});
