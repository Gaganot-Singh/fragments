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

  test('allows authenticated users to create a markdown fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/markdown')
      .send('# Sample Markdown')
      .expect(201);
    expect(res.header.location).toMatch(/\/v1\/fragments\/([\w-]+)$/);
  });

  test('allows authenticated users to create an HTML fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/html')
      .send('<p>This is a sample fragment</p>')
      .expect(201);
    expect(res.header.location).toMatch(/\/v1\/fragments\/([\w-]+)$/);
  });

  test('allows authenticated users to create a CSV fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'text/csv')
      .send('col1,col2\nval1,val2')
      .expect(201);
    expect(res.header.location).toMatch(/\/v1\/fragments\/([\w-]+)$/);
  });

  test('allows authenticated users to create a JSON fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'application/json')
      .send(JSON.stringify({ key: 'value' }))
      .expect(201);
    expect(res.header.location).toMatch(/\/v1\/fragments\/([\w-]+)$/);
  });

  test('allows authenticated users to create a YAML fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('content-type', 'application/yaml')
      .send('key: value')
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
