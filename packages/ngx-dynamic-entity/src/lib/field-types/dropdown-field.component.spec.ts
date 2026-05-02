import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DropdownFieldComponent } from './dropdown-field.component';

describe('DropdownFieldComponent', () => {
  let component: DropdownFieldComponent;
  let fixture: ComponentFixture<DropdownFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownFieldComponent, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownFieldComponent);
    component = fixture.componentInstance;
    component.field = { 
      label: { en: 'Color' },
      options: [
        { value: 'r', label: { en: 'Red' } },
        { value: 'b', label: { en: 'Blue' } }
      ]
    } as any;
    component.control = new FormControl('r');
    fixture.detectChanges();
  });

  it('should render options', () => {
    const options = fixture.nativeElement.querySelectorAll('option');
    // +1 for placeholder
    expect(options.length).toBe(3);
    expect(options[1].textContent).toBe('Red');
  });

  it('should show correct label in readonly mode', () => {
    component.readonly = true;
    fixture.detectChanges();
    const val = fixture.nativeElement.querySelector('.ngx-field__value');
    expect(val.textContent).toBe('Red');
  });
});
