import validate from '../validate.middleware.js';
import { z } from 'zod';

describe('Validate Middleware', () => {
  const schema = z.object({
    id: z.string(),
  });

  test('should validate req.body correctly', () => {
    const req = {
      body: { id: '123' },
    };
    const res = {};
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    validate(schema, 'body')(req, res, next);

    expect(req.body).toEqual({ id: '123' });
    expect(nextCalled).toBe(true);
  });

  test('should validate req.query correctly, bypassing read-only query getter', () => {
    const req = {};
    Object.defineProperty(req, 'query', {
      get: () => ({ id: '123' }),
      configurable: true,
    });
    const res = {};
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    validate(schema, 'query')(req, res, next);

    expect(req.query).toEqual({ id: '123' });
    expect(nextCalled).toBe(true);
  });

  test('should throw error on invalid data', () => {
    const req = {
      body: { invalidField: 'abc' },
    };
    const res = {};
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    expect(() => {
      validate(schema, 'body')(req, res, next);
    }).toThrow();
    expect(nextCalled).toBe(false);
  });
});
