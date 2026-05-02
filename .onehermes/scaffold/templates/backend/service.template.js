module.exports = (config) => {
  const { featureName, pascalCase } = normalizeConfig(config);

  return `const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');
const { getModelByTenant } = require('../../models/getModelByTenant');

/**
 * Business logic for ${featureName}
 * Service layer: validate, transform, persist, publish events
 */

class ${pascalCase}Service {
  async list(tenantContext, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    try {
      // Get tenant model
      const Model = getModelByTenant(tenantContext.realm, '${pascalCase}');

      // Fetch records with pagination
      const [data, total] = await Promise.all([
        Model.find({ tenantId: tenantContext.realm })
          .limit(limit)
          .skip(skip)
          .lean(),
        Model.countDocuments({ tenantId: tenantContext.realm })
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to list ${featureName}', { error, tenantContext });
      throw error;
    }
  }

  async getById(tenantContext, id) {
    try {
      const Model = getModelByTenant(tenantContext.realm, '${pascalCase}');
      const record = await Model.findById(id).lean();

      if (!record) {
        throw new ApiError('${pascalCase} not found', 404, { id });
      }

      return record;
    } catch (error) {
      logger.error('Failed to get ${featureName}', { error, id, tenantContext });
      throw error;
    }
  }

  async create(tenantContext, data) {
    try {
      // TODO: Add business validation

      const Model = getModelByTenant(tenantContext.realm, '${pascalCase}');
      const record = await Model.create({
        ...data,
        tenantId: tenantContext.realm,
        createdBy: tenantContext.userId
      });

      logger.info('${pascalCase} created', { id: record._id, tenantContext });

      // TODO: Publish Kafka event
      // await kafkaProducer.publishEvent('${featureName}.created', { id: record._id });

      return record;
    } catch (error) {
      logger.error('Failed to create ${featureName}', { error, data, tenantContext });
      throw error;
    }
  }

  async update(tenantContext, id, data) {
    try {
      const Model = getModelByTenant(tenantContext.realm, '${pascalCase}');

      const record = await Model.findByIdAndUpdate(
        id,
        { ...data, updatedAt: new Date() },
        { new: true }
      ).lean();

      if (!record) {
        throw new ApiError('${pascalCase} not found', 404, { id });
      }

      logger.info('${pascalCase} updated', { id, tenantContext });
      return record;
    } catch (error) {
      logger.error('Failed to update ${featureName}', { error, id, data, tenantContext });
      throw error;
    }
  }

  async delete(tenantContext, id) {
    try {
      const Model = getModelByTenant(tenantContext.realm, '${pascalCase}');
      const record = await Model.findByIdAndDelete(id);

      if (!record) {
        throw new ApiError('${pascalCase} not found', 404, { id });
      }

      logger.info('${pascalCase} deleted', { id, tenantContext });
    } catch (error) {
      logger.error('Failed to delete ${featureName}', { error, id, tenantContext });
      throw error;
    }
  }
}

module.exports = new ${pascalCase}Service();
`;
};

function normalizeConfig(config) {
  const pascalCase = config.featureName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return { featureName: config.featureName, pascalCase };
}
