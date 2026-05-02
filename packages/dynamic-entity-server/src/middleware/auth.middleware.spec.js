'use strict';

const authMiddleware = require('./auth.middleware');

describe('Auth Middleware', () => {
  let req;
  let next;

  beforeEach(() => {
    req = {};
    next = vi.fn();
  });

  it('should call authHandler and attach userRoles to req', async () => {
    const authHandler = vi.fn().mockResolvedValue({ userRoles: ['admin'] });
    const middleware = authMiddleware(authHandler);

    await middleware(req, {}, next);

    expect(authHandler).toHaveBeenCalledWith(req);
    expect(req.userRoles).toEqual(['admin']);
    expect(next).toHaveBeenCalledWith();
  });

  it('should default to empty roles if authHandler returns non-array userRoles', async () => {
    const authHandler = vi.fn().mockResolvedValue({ userRoles: 'not-an-array' });
    const middleware = authMiddleware(authHandler);

    await middleware(req, {}, next);

    expect(req.userRoles).toEqual([]);
    expect(next).toHaveBeenCalledWith();
  });

  it('should default to empty roles if no authHandler provided', async () => {
    const middleware = authMiddleware(undefined);

    await middleware(req, {}, next);

    expect(req.userRoles).toEqual([]);
    expect(next).toHaveBeenCalledWith();
  });

  it('should pass errors from authHandler to next()', async () => {
    const error = new Error('Auth service down');
    const authHandler = vi.fn().mockRejectedValue(error);
    const middleware = authMiddleware(authHandler);

    await middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
