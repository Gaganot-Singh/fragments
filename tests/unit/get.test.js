const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/', () => {
  test('return status 200 authenticated users', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.body.fragments).toEqual([]);
  });

  test('authenticated users get an empty array if no fragments exist', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.body.fragments).toEqual([]);
  });

  test('unauthenticated requests are denied', async () => {
    const res = await request(app).get('/v1/fragments');
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app)
      .get('/v1/fragments')
      .auth('invaliduser@email.com', 'invalidpassword');
    expect(res.statusCode).toBe(401);
  });

  test('fetching correct fragments', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is my fragment string');
    const id = res.body.fragment.id;

    const res2 = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res2.body.fragments[0]).toBe(id);
  });

  test('testing GET /fragments?expand=1', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is my fragment string');
    const id = res.body.fragment.id;
    const ownerId = res.body.fragment.ownerId;

    const res2 = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');
    expect(res2.body.fragments[1].id).toBe(id);
    expect(res2.body.fragments[1].ownerId).toBe(ownerId);
  });

  // Additional tests
  test('testing GET /fragments?expand=0', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is my fragment string');
    const id = res.body.fragment.id;

    const res2 = await request(app)
      .get('/v1/fragments?expand=0')
      .auth('user1@email.com', 'password1');
    expect(res2.body.fragments[2]).toBe(id);
  });
});

describe('GET /v1/fragments/:id', () => {
  test('unauthenticated requests are denied', async () => {
    const res = await request(app).get('/v1/fragments/fragmentId');
    expect(res.statusCode).toBe(401);
  });

  test('deny access for requests with incorrect credentials', async () => {
    const res = await request(app)
      .get('/v1/fragments/fragmentId')
      .auth('invaliduser@email.com', 'invalidpassword');
    expect(res.statusCode).toBe(401);
  });

  test('should return specific fragment data for authenticated user', async () => {
    const body = 'This is my first fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(body);
    const id = res.body.fragment.id;
    const res2 = await request(app).get(`/v1/fragments/${id}`).auth('user1@email.com', 'password1');
    expect(res2.statusCode).toBe(200);
    expect(res2.text).toBe(body);
  });

  test('return 404 if fragment with given ID does not exist', async () => {
    const res = await request(app)
      .get('/v1/fragments/non_existent_fragment_id')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
  });

  test('must return 200 for supported formats when requested', async () => {
    const body = 'This is a fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(body);
    const id = res.body.fragment.id;

    const res2 = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');
    expect(res2.statusCode).toBe(200);
    expect(res2.text).toBe(body);
  });

  test('must return status 415 if unsupported format is requested', async () => {
    const body = 'This is a fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(body);
    const id = res.body.fragment.id;

    const res2 = await request(app)
      .get(`/v1/fragments/${id}.unsupported`)
      .auth('user1@email.com', 'password1');
    expect(res2.statusCode).toBe(415);
  });

  // Additional tests
  test('must return status 415 for .md extension when fragment type is not text/markdown', async () => {
    const body = 'This is a plain text fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(body);
    const id = res.body.fragment.id;

    const res2 = await request(app)
      .get(`/v1/fragments/${id}.md`)
      .auth('user1@email.com', 'password1');
    expect(res2.statusCode).toBe(415);
  });

  test('must return status 200 for .html extension when fragment type is text/markdown', async () => {
    const body = '# This is a markdown fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(body);
    const id = res.body.fragment.id;

    const res2 = await request(app)
      .get(`/v1/fragments/${id}.html`)
      .auth('user1@email.com', 'password1');
    expect(res2.statusCode).toBe(200);
  });
});

test('must return status 200 for .json extension when fragment type is text/csv', async () => {
  const csvData = 'name,age\nJohn Doe,29\nJane Doe,27';
  const res = await request(app)
    .post('/v1/fragments')
    .auth('user1@email.com', 'password1')
    .set('Content-Type', 'text/csv')
    .send(csvData);
  const id = res.body.fragment.id;

  const res2 = await request(app)
    .get(`/v1/fragments/${id}.json`)
    .auth('user1@email.com', 'password1');
  expect(res2.statusCode).toBe(200);
  expect(res2.type).toBe('application/json');
  const jsonResponse = JSON.parse(res2.text);
  expect(jsonResponse).toEqual([
    { name: 'John Doe', age: '29' },
    { name: 'Jane Doe', age: '27' }
  ]);
});

test('must return status 200 for .csv extension when fragment type is application/json', async () => {
  const jsonData = [
    { name: 'John Doe', age: 29 },
    { name: 'Jane Doe', age: 27 }
  ];
  const res = await request(app)
    .post('/v1/fragments')
    .auth('user1@email.com', 'password1')
    .set('Content-Type', 'application/json')
    .send(JSON.stringify(jsonData));
  const id = res.body.fragment.id;

  const res2 = await request(app)
    .get(`/v1/fragments/${id}.csv`)
    .auth('user1@email.com', 'password1');
  expect(res2.statusCode).toBe(200);
  expect(res2.type).toBe('text/csv');
  expect(res2.text).toContain('name,age');
  expect(res2.text).toContain('John Doe,29');
  expect(res2.text).toContain('Jane Doe,27');
});

describe('GET /v1/fragments/:id/info', () => {
  test('unauthenticated requests are denied', async () => {
    const res = await request(app).get('/v1/fragments/fragmentId/info');
    expect(res.statusCode).toBe(401);
  });

  test('deny access for requests with incorrect credentials', async () => {
    const res = await request(app)
      .get('/v1/fragments/fragmentId/info')
      .auth('invaliduser@email.com', 'invalidpassword');
    expect(res.statusCode).toBe(401);
  });

  test('should return fragment metadata for authenticated user', async () => {
    const body = 'This is my first fragment';
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(body);
    const id = res.body.fragment.id;
    const res2 = await request(app)
      .get(`/v1/fragments/${id}/info`)
      .auth('user1@email.com', 'password1')
      .expect(200);
    expect(res2.body.status).toBe('ok');
    expect(res2.body.fragment).toHaveProperty('id', id);
    expect(res2.body.fragment).toHaveProperty('ownerId');
    expect(res2.body.fragment).toHaveProperty('created');
    expect(res2.body.fragment).toHaveProperty('updated');
    expect(res2.body.fragment).toHaveProperty('type');
    expect(res2.body.fragment).toHaveProperty('size');
  });

  test('return 404 if fragment with given ID does not exist', async () => {
    const res = await request(app)
      .get('/v1/fragments/non_existent_fragment_id/info')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
  });
});
