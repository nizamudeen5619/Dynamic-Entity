import { Component, Input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import type { FieldConfig } from '@dynamic-entity/core';

@Component({
  selector: 'ngx-checkbox-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="ngx-field ngx-field--checkbox" [class.ngx-field--readonly]="readonly" [class.ngx-field--masked]="masked">
      @if (masked) {
        <label class="ngx-field__label">{{ field.label[language] || field.label['en'] }}</label>
        <span class="ngx-field__value ngx-field__value--masked">XXXXXXXXX</span>
      } @else if (readonly) {
        <label class="ngx-field__label">{{ field.label[language] || field.label['en'] }}</label>
        <span class="ngx-field__value">{{ control.value ? 'Yes' : 'No' }}</span>
      } @else {
        <label class="ngx-field__label">
          <input
            class="ngx-field__input"
            type="checkbox"
            [formControl]="$any(control)"
            [attr.disabled]="field.disabled ? true : null"
          />
          {{ field.label[language] || field.label['en'] }}
        </label>
      }
    </div>
  `,
})
export class CheckboxFieldComponent {
  @Input() field!: FieldConfig;
  @Input() control!: AbstractControl;
  @Input() language: string = 'en';
  @Input() readonly: boolean = false;
  @Input() masked: boolean = false;
}
