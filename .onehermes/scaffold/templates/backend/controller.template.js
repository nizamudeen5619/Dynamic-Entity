module.exports = (config) => {
  const { featureName, pascalCase } = normalizeConfig(config);

  return `const ApiError = require('../../utils/ApiError');
const ${featureName}Service = require('../../services/${featureName}.service');
const ${featureName}Validation = require('../../validations/${featureName}.validation');
const logger = require('../../utils/logger');

/**
 * Controller for ${featureName} endpoints
 * Routes → Controller → Service → Model
 */

class ${pascalCase}Controller {
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await ${featureName}Service.list(req.tenantContext, { page, limit });

      res.json({
        status: true,
        data: result.data,
        message: 'Records fetched successfully',
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const record = await ${featureName}Service.getById(req.tenantContext, id);

      res.json({
        status: true,
        data: record,
        message: 'Record fetched successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      // Validate request body
      const { error, value } = await ${featureName}Validation.create.validateAsync(req.body);
      if (error) throw new ApiError(error.message, 400);

      // Create record
      const record = await ${featureName}Service.create(req.tenantContext, value);

      res.status(201).json({
        status: true,
        data: record,
        message: '${pascalCase} created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = await ${featureName}Validation.update.validateAsync(req.body);
      if (error) throw new ApiError(error.message, 400);

      const record = await ${featureName}Service.update(req.tenantContext, id, value);

      res.json({
        status: true,
        data: record,
        message: '${pascalCase} updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await ${featureName}Service.delete(req.tenantContext, id);

      res.json({
        status: true,
        message: '${pascalCase} deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ${pascalCase}Controller();
`;
};

function normalizeConfig(config) {
  const pascalCase = config.featureName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return {
    featureName: config.featureName,
    pascalCase
  };
}
