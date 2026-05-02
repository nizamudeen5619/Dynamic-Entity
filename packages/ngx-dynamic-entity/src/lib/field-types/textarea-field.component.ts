import { Component, Input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import type { FieldConfig } from '@dynamic-entity/core';

@Component({
  selector: 'ngx-textarea-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="ngx-field ngx-field--textarea" [class.ngx-field--readonly]="readonly" [class.ngx-field--masked]="masked">
      <label class="ngx-field__label">{{ field.label[language] || field.label['en'] }}</label>
      @if (masked) {
        <span class="ngx-field__value ngx-field__value--masked">XXXXXXXXX</span>
      } @else if (readonly) {
        <span class="ngx-field__value">{{ control.value }}</span>
      } @else {
        <textarea
          class="ngx-field__input"
          [formControl]="$any(control)"
          [placeholder]="field.placeholder?.[language] || field.placeholder?.['en'] || ''"
          [attr.disabled]="field.disabled ? true : null"
          rows="3"
        ></textarea>
        @if (control.invalid && control.touched) {
          <span class="ngx-field__error">This field has an error</span>
        }
      }
    </div>
  `,
})
export class TextareaFieldComponent {
  @Input() field!: FieldConfig;
  @Input() control!: AbstractControl;
  @Input() language: string = 'en';
  @Input() readonly: boolean = false;
  @Input() masked: boolean = false;
}
