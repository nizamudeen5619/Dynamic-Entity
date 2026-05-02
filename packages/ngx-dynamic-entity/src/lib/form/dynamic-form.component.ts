import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  inject,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { EntityConfig, VersionedRecord } from '@dynamic-entity/core';
import { DynamicFieldComponent } from './dynamic-field/dynamic-field.component';
import { ValidatorRegistryService } from '../services/validator-registry.service';
import { HookRegistryService } from '../services/hook-registry.service';
import { VersionService } from '../services/version.service';
import { RbacService } from '../services/rbac.service';

/**
 * DynamicFormComponent — the main form component.
 * Renders a reactive form from EntityConfig with tab support, dependencies,
 * migration banner, and RBAC-gated submission.
 *
 * ONEHERMES pattern: isSaving state lock prevents subscription cyclones (ADR-002).
 * ONEHERMES bug fix: visibility rules re-evaluated after initialData loads (form-fixes doc).
 * ONEHERMES bug fix: use @for + @if separately, not both on same element (form-fixes doc).
 */
@Component({
  selector: 'ngx-dynamic-form',
  standalone: true,
  imports: [ReactiveFormsModule, DynamicFieldComponent],
  templateUrl: './dynamic-form.component.html',
})
export class DynamicFormComponent implements OnChanges {
  // ─── Inputs ───────────────────────────────────────────────────────────────
  @Input() config!: EntityConfig;
  @Input() initialData?: Record<string, any>;
  @Input() userRoles: string[] = [];
  @Input() language: string = 'en';
  @Input() readonly: boolean = false;
  @Input() loading: boolean = false;
  @Input() error: string | null = null;

  // ─── Outputs ──────────────────────────────────────────────────────────────
  @Output() formSubmit = new EventEmitter<Record<string, any>>();
  @Output() formChange = new EventEmitter<Record<string, any>>();
  @Output() formReset = new EventEmitter<void>();

  // ─── Services ─────────────────────────────────────────────────────────────
  private readonly fb = inject(FormBuilder);
  private readonly validatorRegistry = inject(ValidatorRegistryService);
  private readonly hookRegistry = inject(HookRegistryService);
  protected readonly versionService = inject(VersionService);
  private readonly rbacService = inject(RbacService);

  // ─── Signals (local reactive state) ───────────────────────────────────────
  readonly activeTab = signal<string>('');
  readonly isSaving = signal(false); // ADR-002: isSaving lock prevents API spam

  // ─── Form ─────────────────────────────────────────────────────────────────
  form!: FormGroup;

  // ─── Computed ─────────────────────────────────────────────────────────────
  get tabs() {
    return (this.config?.tabs || []).sort((a, b) => a.order - b.order);
  }

  get fieldsForActiveTab() {
    const tabId = this.activeTab();
    return (this.config?.fields || []).filter(f => {
      if (!this.tabs.length) return true; // No tabs — show all
      return f.tab === tabId || (!f.tab && tabId === this.tabs[0]?.id);
    });
  }

  get permissions() {
    return this.rbacService.getPermissions(this.config, this.userRoles);
  }

  get needsMigration(): boolean {
    return this.versionService.needsMigration(this.initialData || {}, this.config);
  }

  get canSubmit(): boolean {
    return (
      this.permissions.canEdit &&
      !this.readonly &&
      !this.isSaving() &&
      !this.versionService.shouldBlockSubmit(this.initialData || {}, this.config)
    );
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      this.buildForm();
    }
    // ONEHERMES fix: re-apply data after initialData loads (form-fixes doc)
    if (changes['initialData'] && this.form && this.initialData) {
      this.patchForm(this.initialData);
    }
    if (changes['config'] && this.tabs.length) {
      this.activeTab.set(this.tabs[0]?.id || '');
    }
  }

  private buildForm(): void {
    const controls: Record<string, any> = {};
    for (const field of this.config.fields || []) {
      if (field.isSystem) continue; // System fields not in form controls
      const validators = this.validatorRegistry.resolveAll(field.validators);
      controls[field.id] = [field.defaultValue ?? null, validators];
    }
    this.form = this.fb.group(controls);

    // Emit changes via formChange output
    this.form.valueChanges.subscribe(value => this.formChange.emit(value));

    // Apply initial data after form builds
    if (this.initialData) {
      this.patchForm(this.initialData);
    }

    if (this.tabs.length && !this.activeTab()) {
      this.activeTab.set(this.tabs[0].id);
    }
  }

  private patchForm(data: Record<string, any>): void {
    // Filter empty objects (ONEHERMES array field empty row bug fix)
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );
    this.form.patchValue(cleanData, { emitEvent: false });
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  async submit(): Promise<void> {
    if (!this.canSubmit || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // ADR-002: isSaving lock — prevents subscription cyclones / duplicate API calls
    if (this.isSaving()) return;
    this.isSaving.set(true);

    try {
      let data = { ...this.form.value };

      // Run pre-submit hook (Angular-side)
      data = await this.hookRegistry.run(`${this.config.entity}:beforeSave`, data, {
        config: this.config,
        userRoles: this.userRoles,
      });

      this.formSubmit.emit(data);
    } finally {
      // Reset saving lock in the consumer's success/error handler — here we just unblock
      this.isSaving.set(false);
    }
  }

  reset(): void {
    this.form.reset();
    if (this.initialData) this.patchForm(this.initialData);
    this.formReset.emit();
  }

  getControl(fieldId: string) {
    return this.form?.get(fieldId);
  }
}
