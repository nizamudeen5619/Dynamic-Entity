import { Component, Input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import type { FieldConfig } from '@dynamic-entity/core';

/** ADR-008: Shared field component contract — all 8 built-in types implement this. */
@Component({
  selector: 'ngx-text-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="ngx-field ngx-field--text" [class.ngx-field--readonly]="readonly" [class.ngx-field--masked]="masked">
      <label class="ngx-field__label">{{ field.label[language] || field.label['en'] }}</label>
      @if (masked) {
        <span class="ngx-field__value ngx-field__value--masked">XXXXXXXXX</span>
      } @else if (readonly) {
        <span class="ngx-field__value">{{ control.value }}</span>
      } @else {
        <input
          class="ngx-field__input"
          type="text"
          [formControl]="$any(control)"
          [placeholder]="field.placeholder?.[language] || field.placeholder?.['en'] || ''"
          [attr.disabled]="field.disabled ? true : null"
        />
        @if (control.invalid && control.touched) {
          <span class="ngx-field__error">This field has an error</span>
        }
      }
    </div>
  `,
})
export class TextFieldComponent {
  @Input() field!: FieldConfig;
  @Input() control!: AbstractControl;
  @Input() language: string = 'en';
  @Input() readonly: boolean = false;
  @Input() masked: boolean = false;
}
