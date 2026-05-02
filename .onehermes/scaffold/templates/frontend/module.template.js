module.exports = (config) => {
  const { featureName, pascalCase } = normalizeConfig(config);

  return `import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ${pascalCase}Component } from './${featureName}.component';
import { ${pascalCase}RoutingModule } from './${featureName}-routing.module';

@NgModule({
  declarations: [${pascalCase}Component],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ${pascalCase}RoutingModule
  ]
})
export class ${pascalCase}Module {}
`;
};

function normalizeConfig(config) {
  const pascalCase = config.featureName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return { featureName: config.featureName, pascalCase };
}
