'use strict';

const errorHandler = require('./error-handler');
const ApiError = require('../utils/ApiError');

describe('Error Handler Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    next = vi.fn();
  });

  it('should handle ApiError and return formatted response', () => {
    const error = new ApiError('Validation failed', 400, 'ERR_01', ['Name is required']);
    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'ERR_01',
        message: 'Validation failed',
        details: ['Name is required']
      }
    });
  });

  it('should handle generic errors and return 500', () => {
    const error = new Error('Database crash');
    // Suppress console.error during test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: []
      }
    });
    spy.mockRestore();
  });
});
