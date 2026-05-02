module.exports = (config) => {
  const { featureName, pascalCase } = normalizeConfig(config);
  const routePath = config.domain || featureName;

  return `const express = require('express');
const router = express.Router();
const ${featureName}Controller = require('../../controllers/${featureName}.controller');
const authenticateToken = require('../../middlewares/authenticateToken');
const validateTenantContext = require('../../middlewares/validateTenantContext');

/**
 * Routes for ${featureName}
 * Base: /v1/${routePath}
 */

// Middleware
router.use(authenticateToken);
router.use(validateTenantContext);

// Routes
router.get('/', ${featureName}Controller.list);
router.get('/:id', ${featureName}Controller.getById);
router.post('/', ${featureName}Controller.create);
router.put('/:id', ${featureName}Controller.update);
router.delete('/:id', ${featureName}Controller.delete);

module.exports = router;
`;
};

function normalizeConfig(config) {
  const pascalCase = config.featureName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return { featureName: config.featureName, pascalCase };
}
