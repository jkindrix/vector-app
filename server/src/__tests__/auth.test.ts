import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken, generateToken } from '../middleware/auth';

const TEST_SECRET = 'test-jwt-secret-for-unit-tests';

describe('generateToken', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('produces a valid JWT that can be verified', () => {
    const payload = { id: 'user-1', username: 'admin' };
    const token = generateToken(payload);

    const decoded = jwt.verify(token, TEST_SECRET) as jwt.JwtPayload;
    expect(decoded.id).toBe('user-1');
    expect(decoded.username).toBe('admin');
    expect(decoded.exp).toBeDefined();
  });

  it('throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => generateToken({ id: '1', username: 'admin' })).toThrow('JWT_SECRET');
  });
});

describe('authenticateToken', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let statusCode: number;
  let jsonBody: any;

  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    statusCode = 0;
    jsonBody = null;

    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockImplementation((code: number) => {
        statusCode = code;
        return mockRes;
      }),
      json: jest.fn().mockImplementation((body: any) => {
        jsonBody = body;
      }),
    } as Partial<Response>;
    mockNext = jest.fn();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('calls next() with a valid token', () => {
    const token = jwt.sign({ id: 'u1', username: 'admin' }, TEST_SECRET);
    mockReq.headers = { authorization: `Bearer ${token}` };

    authenticateToken(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect((mockReq as any).user).toEqual(
      expect.objectContaining({ id: 'u1', username: 'admin' })
    );
  });

  it('returns 401 when no token is provided', () => {
    mockReq.headers = {};

    authenticateToken(mockReq as Request, mockRes as Response, mockNext);

    expect(statusCode).toBe(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 with an invalid token', () => {
    mockReq.headers = { authorization: 'Bearer invalid.token.here' };

    authenticateToken(mockReq as Request, mockRes as Response, mockNext);

    expect(statusCode).toBe(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 500 when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    const token = jwt.sign({ id: 'u1', username: 'admin' }, TEST_SECRET);
    mockReq.headers = { authorization: `Bearer ${token}` };

    authenticateToken(mockReq as Request, mockRes as Response, mockNext);

    expect(statusCode).toBe(500);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
