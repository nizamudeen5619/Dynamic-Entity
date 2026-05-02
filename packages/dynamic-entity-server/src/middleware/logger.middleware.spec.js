'use strict';

const loggerMiddleware = require('./logger.middleware');

describe('Logger Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { method: 'GET', originalUrl: '/test' };
    res = { statusCode: 200, on: vi.fn() };
    next = vi.fn();
  });

  it('should call next() and register finish listener', () => {
    loggerMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should log on finish', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    loggerMiddleware(req, res, next);
    
    // Trigger the callback
    const callback = res.on.mock.calls.find(c => c[0] === 'finish')[1];
    callback();

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[dynamic-entity] GET /test 200'));
    spy.mockRestore();
  });
});
