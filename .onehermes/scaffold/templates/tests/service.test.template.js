module.exports = (config) => {
  const { featureName, pascalCase } = normalizeConfig(config);

  return `const ${featureName}Service = require('../services/${featureName}.service');
const { getModelByTenant } = require('../models/getModelByTenant');

describe('${pascalCase}Service', () => {
  const mockTenantContext = {
    realm: 'expert',
    userId: 'user123'
  };

  // TODO: Mock MongoDB model
  // jest.mock('../models/getModelByTenant');

  describe('list', () => {
    it('should return paginated records', async () => {
      // TODO: Implement test
      // const result = await ${featureName}Service.list(mockTenantContext, { page: 1, limit: 20 });
      // expect(result.data).toBeDefined();
      // expect(result.pagination).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a new record', async () => {
      // TODO: Implement test
      // const data = { /* your test data */ };
      // const result = await ${featureName}Service.create(mockTenantContext, data);
      // expect(result._id).toBeDefined();
    });

    it('should validate input', async () => {
      // TODO: Implement test
      // const invalidData = { /* missing required fields */ };
      // expect(() => ${featureName}Service.create(mockTenantContext, invalidData)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update a record', async () => {
      // TODO: Implement test
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      // TODO: Implement test
    });
  });
});
`;
};

function normalizeConfig(config) {
  const pascalCase = config.featureName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return { featureName: config.featureName, pascalCase };
}
