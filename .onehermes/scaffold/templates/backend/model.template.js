module.exports = (config) => {
  const { featureName, pascalCase } = normalizeConfig(config);

  return `const mongoose = require('mongoose');

/**
 * MongoDB schema for ${featureName}
 */

const ${featureName}Schema = new mongoose.Schema(
  {
    // Tenant context (REQUIRED)
    tenantId: {
      type: String,
      required: true,
      index: true
    },

    // TODO: Add your fields here
    // Example:
    // name: { type: String, required: true },
    // amount: { type: Number, required: true, min: 0 },
    // status: { type: String, enum: ['draft', 'submitted', 'approved'], default: 'draft' },

    // Audit fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

// TODO: Add indexes for common query patterns
// Example:
// ${featureName}Schema.index({ tenantId: 1, status: 1 });
// ${featureName}Schema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('${pascalCase}', ${featureName}Schema);
`;
};

function normalizeConfig(config) {
  const pascalCase = config.featureName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return { featureName: config.featureName, pascalCase };
}
