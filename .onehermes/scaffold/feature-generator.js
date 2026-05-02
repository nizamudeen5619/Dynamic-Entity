#!/usr/bin/env node

/**
 * ONEHERMES Feature Scaffold Generator
 *
 * Generates complete full-stack boilerplate for a new feature.
 *
 * Usage: node scaffold/feature-generator.js --name expense-claim --type crud
 */

const fs = require('fs');
const path = require('path');

const config = parseArgs();

// Templates
const templates = {
  // Backend
  route: require('./templates/backend/route.template.js'),
  controller: require('./templates/backend/controller.template.js'),
  backendService: require('./templates/backend/service.template.js'),
  model: require('./templates/backend/model.template.js'),
  validation: require('./templates/backend/validation.template.js'),

  // Frontend
  component: require('./templates/frontend/component.template.js'),
  frontendService: require('./templates/frontend/service.template.js'),
  module: require('./templates/frontend/module.template.js'),

  // Tests
  serviceTest: require('./templates/tests/service.test.template.js')
};

async function generateScaffold() {
  console.log(`\n🚀 Scaffolding feature: ${config.featureName}`);
  console.log(`   Type: ${config.type}`);
  console.log(`   Domain: ${config.domain || 'general'}\n`);

  const files = [];

  // Generate backend files
  const backendDir = `src`;
  files.push({
    path: `${backendDir}/routes/v1/${config.domain || 'feature'}.route.js`,
    content: templates.route(config)
  });

  files.push({
    path: `${backendDir}/controllers/${config.featureName}.controller.js`,
    content: templates.controller(config)
  });

  files.push({
    path: `${backendDir}/services/${config.featureName}.service.js`,
    content: templates.backendService(config)
  });

  if (config.type === 'crud' || config.type === 'entity') {
    files.push({
      path: `${backendDir}/models/${config.featureName}.model.js`,
      content: templates.model(config)
    });
  }

  files.push({
    path: `${backendDir}/validations/${config.featureName}.validation.js`,
    content: templates.validation(config)
  });

  // Generate frontend files
  if (config.includeUI) {
    const componentDir = `src/app/modules/${config.featureName}`;
    files.push({
      path: `${componentDir}/${config.featureName}.module.ts`,
      content: templates.module(config)
    });

    files.push({
      path: `${componentDir}/${config.featureName}.component.ts`,
      content: templates.component(config)
    });

    files.push({
      path: `${componentDir}/${config.featureName}.component.html`,
      content: `<!-- ${config.featureName} template -->\n<p>{{ (data$ | async) | json }}</p>`
    });

    files.push({
      path: `${componentDir}/${config.featureName}.component.scss`,
      content: `// ${config.featureName} styles\n`
    });

    files.push({
      path: `${componentDir}/${config.featureName}.service.ts`,
      content: templates.frontendService(config)
    });
  }

  // Generate test files
  files.push({
    path: `__tests__/${config.featureName}.service.test.js`,
    content: templates.serviceTest(config)
  });

  // Create files
  let created = 0;
  for (const file of files) {
    createFile(file.path, file.content);
    console.log(`   ✅ Created: ${file.path}`);
    created++;
  }

  console.log(`\n✨ Scaffolded ${created} files!`);
  console.log(`\nNext steps:`);
  console.log(`  1. Update service methods with business logic`);
  console.log(`  2. Fill in model validation rules`);
  console.log(`  3. Add Keycloak role checks if needed`);
  console.log(`  4. Write tests`);
  console.log(`  5. Register route in src/routes/v1/index.js`);
  console.log(`  6. Run: npm test to verify\n`);
}

function createFile(filePath, content) {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Don't overwrite existing files
  if (fs.existsSync(fullPath)) {
    console.warn(`   ⚠️  File exists, skipping: ${filePath}`);
    return;
  }

  fs.writeFileSync(fullPath, content);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    featureName: null,
    type: 'crud', // crud | entity | endpoint | service
    domain: null,
    includeUI: true
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name') config.featureName = args[++i];
    if (args[i] === '--type') config.type = args[++i];
    if (args[i] === '--domain') config.domain = args[++i];
    if (args[i] === '--no-ui') config.includeUI = false;
  }

  if (!config.featureName) {
    console.error('Usage: node scaffold/feature-generator.js --name <feature-name> [--type crud|entity|endpoint|service] [--domain domain] [--no-ui]');
    process.exit(1);
  }

  return config;
}

// Run
generateScaffold().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
