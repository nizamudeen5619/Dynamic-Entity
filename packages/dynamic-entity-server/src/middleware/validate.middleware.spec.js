'use strict';

const validateMiddleware = require('./validate.middleware');
const ApiError = require('../utils/ApiError');

describe('Validate Middleware', () => {
  let mockAdapter;
  let next;

  beforeEach(() => {
    mockAdapter = {
      findConfig: vi.fn()
    };
    next = vi.fn();
  });

  it('should throw 404 if config is missing', async () => {
    mockAdapter.findConfig.mockResolvedValue(null);
    const middleware = validateMiddleware(mockAdapter, 'strict');
    const req = { params: { entity: 'missing' } };

    await middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });

  it('should collect multiple validation errors', async () => {
    const config = {
      fields: [
        { id: 'name', validators: ['required'], label: { en: 'Name' } },
        { id: 'email', validators: ['required'], label: { en: 'Email' } }
      ]
    };
    mockAdapter.findConfig.mockResolvedValue(config);
    const middleware = validateMiddleware(mockAdapter, 'strict');
    const req = { params: { entity: 'user' }, body: {} };

    await middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.details).toContain("'Name' is required");
    expect(error.details).toContain("'Email' is required");
  });

  it('should throw 409 in strict mode if version is outdated', async () => {
    const config = { version: 2, fields: [] };
    mockAdapter.findConfig.mockResolvedValue(config);
    const middleware = validateMiddleware(mockAdapter, 'strict');
    const req = { params: { entity: 'user' }, body: { _configVersion: 1 } };

    await middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(409);
  });

  it('should flag _needsMigration in graceful mode if version is outdated', async () => {
    const config = { version: 2, fields: [] };
    mockAdapter.findConfig.mockResolvedValue(config);
    const middleware = validateMiddleware(mockAdapter, 'graceful');
    const req = { params: { entity: 'user' }, body: { _configVersion: 1 } };

    await middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body._needsMigration).toBe(true);
    expect(req.entityConfig).toBe(config);
  });

  it('should pass if everything is valid', async () => {
    const config = { version: 1, fields: [{ id: 'name', validators: ['required'] }] };
    mockAdapter.findConfig.mockResolvedValue(config);
    const middleware = validateMiddleware(mockAdapter, 'strict');
    const req = { params: { entity: 'user' }, body: { name: 'John', _configVersion: 1 } };

    await middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.entityConfig).toBe(config);
  });

  it('should handle empty body gracefully', async () => {
    const config = { fields: [{ id: 'name', validators: ['required'] }] };
    mockAdapter.findConfig.mockResolvedValue(config);
    const middleware = validateMiddleware(mockAdapter, 'strict');
    const req = { params: { entity: 'user' }, body: null };

    await middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].details[0]).toContain("'name' is required");
  });

  it('should use field id if label is missing in error message', async () => {
    const config = { fields: [{ id: 'fieldWithoutLabel', validators: ['required'] }] };
    mockAdapter.findConfig.mockResolvedValue(config);
    const middleware = validateMiddleware(mockAdapter, 'strict');
    const req = { params: { entity: 'user' }, body: {} };

    await middleware(req, {}, next);

    const error = next.mock.calls[0][0];
    expect(error.details[0]).toBe("'fieldWithoutLabel' is required");
  });
});
