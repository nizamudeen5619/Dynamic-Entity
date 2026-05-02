import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import type { FieldConfig, EntityConfig, TabConfig } from '@dynamic-entity/core';
import { FieldRegistryService } from '../../services/field-registry.service';
import { RbacService } from '../../services/rbac.service';

/**
 * DynamicFieldComponent — mounts the correct field component for a given FieldConfig.
 * Uses ViewContainerRef.createComponent() and passes inputs via setInput() (ADR-008).
 * Never add field-type-specific logic here — this component must remain generic.
 *
 * The 5 inputs (field, control, language, readonly, masked) are passed to every mounted
 * component uniformly — no special-casing per type.
 */
@Component({
  selector: 'ngx-dynamic-field',
  standalone: true,
  template: `<ng-container #fieldHost></ng-container>`,
})
export class DynamicFieldComponent implements OnChanges {
  @Input() field!: FieldConfig;
  @Input() control!: AbstractControl;
  @Input() config!: EntityConfig;
  @Input() language: string = 'en';
  @Input() readonly: boolean = false;
  @Input() userRoles: string[] = [];

  @ViewChild('fieldHost', { read: ViewContainerRef, static: true })
  private readonly fieldHost!: ViewContainerRef;

  private readonly fieldRegistry = inject(FieldRegistryService);
  private readonly rbacService = inject(RbacService);

  private mountedComponent: any = null;

  ngOnChanges(_changes: SimpleChanges): void {
    this.mountField();
  }

  private mountField(): void {
    if (!this.field || !this.control) return;

    const ComponentClass = this.fieldRegistry.resolve(this.field.type);
    if (!ComponentClass) return; // Unknown field type — render nothing

    // Determine masking for this specific field
    const tab: TabConfig | undefined = (this.config?.tabs || []).find(t => t.id === this.field.tab);
    const masked = this.rbacService.shouldMaskField(this.field, tab, this.config, this.userRoles);

    // Re-use existing component if same type, otherwise recreate
    if (this.mountedComponent && this.mountedComponent instanceof ComponentClass) {
      this.setInputs(this.mountedComponent, masked);
      return;
    }

    this.fieldHost.clear();
    const ref = this.fieldHost.createComponent(ComponentClass);
    this.mountedComponent = ref.instance;
    this.setInputs(ref.instance, masked);
    ref.changeDetectorRef.markForCheck();
  }

  /** Pass all 5 contract inputs via setInput() — uniform for all types (ADR-008) */
  private setInputs(instance: any, masked: boolean): void {
    if ('field' in instance) instance.field = this.field;
    if ('control' in instance) instance.control = this.control;
    if ('language' in instance) instance.language = this.language;
    if ('readonly' in instance) instance.readonly = this.readonly || !!this.field.readonly;
    if ('masked' in instance) instance.masked = masked;
  }
}
