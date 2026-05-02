'use strict';

const { sendSuccess, sendPaginated, sendError } = require('./response.utils');

describe('Response Utils', () => {
  let res;

  beforeEach(() => {
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  it('should send success response', () => {
    sendSuccess(res, { id: 1 }, 'Created', 201);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 1 },
      message: 'Created'
    });
  });

  it('should send paginated response', () => {
    const pagination = { page: 1, pageSize: 10, total: 20, totalPages: 2 };
    sendPaginated(res, [1, 2], pagination);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [1, 2],
      pagination,
      message: 'Success'
    });
  });

  it('should send error response', () => {
    sendError(res, 'CODE', 'Fail', ['detail'], 404);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'CODE', message: 'Fail', details: ['detail'] }
    });
  });
});
