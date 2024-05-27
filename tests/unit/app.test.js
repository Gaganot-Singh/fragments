const request = require('supertest');

const app = require('../../src/app');

describe('API Routes', () => {
  test('GET /unknown-route should return a 404 error', async () => {
    const response = await request(app).get('/abc');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'error',
      error: {
        code: 404,
        message: 'not found',
      },
    });
  });
});
