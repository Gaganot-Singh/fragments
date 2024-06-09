const request = require('supertest');
const app = require('../../src/app');

describe('POST /v1/fragments endpoint', () => {
  test('denies requests without authentication', () =>
    request(app).post('/v1/fragments').expect(401));

  test('denies requests with invalid credentials', () =>
    request(app).post('/v1/fragments').auth('wronguser@email.com', 'wrong_password').expect(401));

  test('allows authenticated users to create a plain text fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/plain')
      .send('This is a sample fragment')
      .expect(201);
    expect(res.header.location).toMatch(/\/v1\/fragments\/([\w-]+)$/);
  });

  test('returns 415 Error for unsupported fragment type', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'application/xml')
      .send('<fragment>This is a sample fragment</fragment>')
      .expect(415);
    expect(res.body.error.message).toBe(
      'The Content-Type of the fragment being sent with the request is not supported'
    );
  });
});
