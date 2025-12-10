import { beforeAll, afterAll } from '@jest/globals';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.SESSION_SECRET = 'test-secret-key-for-jwt';
});

afterAll(async () => {
});
