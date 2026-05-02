import { Component, Input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import type { FieldConfig } from '@dynamic-entity/core';

@Component({
  selector: 'ngx-multi-select-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="ngx-field ngx-field--multiSelect" [class.ngx-field--readonly]="readonly" [class.ngx-field--masked]="masked">
      <label class="ngx-field__label">{{ field.label[language] || field.label['en'] }}</label>
      @if (masked) {
        <span class="ngx-field__value ngx-field__value--masked">XXXXXXXXX</span>
      } @else if (readonly) {
        <span class="ngx-field__value">{{ getLabels(control.value) }}</span>
      } @else {
        <select
          class="ngx-field__input"
          [formControl]="$any(control)"
          [attr.disabled]="field.disabled ? true : null"
          multiple
          size="4"
        >
          @for (option of field.options || []; track option.value) {
            <option [value]="option.value">{{ option.label[language] || option.label['en'] }}</option>
          }
        </select>
        @if (control.invalid && control.touched) {
          <span class="ngx-field__error">This field has an error</span>
        }
      }
    </div>
  `,
})
export class MultiSelectFieldComponent {
  @Input() field!: FieldConfig;
  @Input() control!: AbstractControl;
  @Input() language: string = 'en';
  @Input() readonly: boolean = false;
  @Input() masked: boolean = false;

  getLabels(values: any[]): string {
    if (!Array.isArray(values) || !values.length) return '—';
    return values
      .map(v => {
        const opt = (this.field.options || []).find(o => o.value === v);
        return opt ? (opt.label[this.language] || opt.label['en']) : String(v);
      })
      .join(', ');
  }
}
