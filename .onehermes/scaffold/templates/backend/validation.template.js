module.exports = (config) => {
  const { featureName } = normalizeConfig(config);

  return `const Joi = require('joi');

/**
 * Joi validation schemas for ${featureName}
 */

module.exports = {
  create: Joi.object().keys({
    // TODO: Add validation rules
    // Example:
    // name: Joi.string().required().max(100),
    // amount: Joi.number().required().positive(),
    // status: Joi.string().valid('draft', 'submitted', 'approved')
  }),

  update: Joi.object().keys({
    // TODO: Make fields optional for updates
    // Example:
    // name: Joi.string().max(100),
    // amount: Joi.number().positive(),
    // status: Joi.string().valid('draft', 'submitted', 'approved')
  })
};
`;
};

function normalizeConfig(config) {
  const pascalCase = config.featureName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return { featureName: config.featureName, pascalCase };
}
