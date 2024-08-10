const request = require('supertest');
const app = require('../../src/app');

describe('PUT /v1/fragments/:id', () => {
  test('denies unauthenticated requests', async () => {
    const res = await request(app).put('/v1/fragments/fragmentId').send('Updated data');
    expect(res.statusCode).toBe(401);
  });

  test('returns 404 if fragment does not exist', async () => {
    const res = await request(app)
      .put('/v1/fragments/non_existent_id')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Updated data');
    expect(res.statusCode).toBe(404);
  });

  test('returns 400 if Content-Type does not match', async () => {
    const body = 'Original fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(body);
    const id = res.body.fragment.id;

    const res2 = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('Updated markdown data');
    expect(res2.statusCode).toBe(400);
  });

  test('updates fragment data and returns updated metadata', async () => {
    const body = 'Original fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(body);
    const id = res.body.fragment.id;
  
    const updatedBody = 'Updated fragment data';
    const res2 = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(updatedBody);
  
    expect(res2.statusCode).toBe(200);
    expect(res2.body.fragment.size).toBe(updatedBody.length);
    expect(new Date(res2.body.fragment.updated).getTime()).toBeGreaterThan(new Date(res2.body.fragment.created).getTime());
  });

  test('returns 404 if fragment does not exist', async () => {
    const res = await request(app)
      .put('/v1/fragments/non_existent_id')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Updated data');
    expect(res.statusCode).toBe(404);
  });

  
});
