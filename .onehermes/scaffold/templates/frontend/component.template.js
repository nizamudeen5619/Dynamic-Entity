module.exports = (config) => {
  const { featureName, pascalCase } = normalizeConfig(config);

  return `import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ${pascalCase}Service } from './${featureName}.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

/**
 * ${pascalCase} component
 * Presentational component with smart service injection
 */

@Component({
  selector: 'app-${featureName}',
  templateUrl: './${featureName}.component.html',
  styleUrls: ['./${featureName}.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ${pascalCase}Component implements OnInit {
  form: FormGroup;
  data$ = this.service.data$;
  loading$ = this.service.loading$;
  error$ = this.service.error$;

  private destroy$ = new Subject<void>();

  constructor(private service: ${pascalCase}Service, private fb: FormBuilder) {
    this.form = this.fb.group({
      // TODO: Add form controls
      // Example:
      // name: [null, Validators.required],
      // amount: [null, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.service.loadData();
  }

  submit() {
    if (this.form.invalid) return;

    this.service.create(this.form.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.form.reset();
          // Show success toast
        },
        error => {
          // Show error toast
        }
      );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
`;
};

function normalizeConfig(config) {
  const pascalCase = config.featureName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return { featureName: config.featureName, pascalCase };
}
