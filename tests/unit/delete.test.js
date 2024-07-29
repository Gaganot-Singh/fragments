// test/unit/post.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('DELETE /Fragments', () => {
  // Unauthorized users should not be able to delete a fragment.
  test('Unauthorized users should not be able to delete a fragment.', async () => {
    // Create a fragment with valid user credentials.
    const fragmentData = 'This is the first fragment data!';
    const postResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(fragmentData),
      fragmentMetaData = postResponse.body.fragment;
    // Ensure the fragment was created successfully.
    expect(postResponse.status).toBe(201);
    // Extract the fragment ID.
    const fragmentId = fragmentMetaData.id;
    // Attempt to delete the fragment using invalid credentials.
    const deleteResponse = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('invalid@email.com', 'password1');
    // Verify that the request was unauthorized.
    expect(deleteResponse.status).toBe(401);
  });

  // Authorized users should be able to delete a fragment.
  test('Authorized users should be able to delete a fragment.', async () => {
    // Create a fragment with valid user credentials.
    const fragmentData = 'This is the first fragment data!';
    const postResponse = await request(app)
        .post('/v1/fragments')
        .auth('user1@email.com', 'password1')
        .set('Content-Type', 'text/plain')
        .send(fragmentData),
      fragmentMetaData = postResponse.body.fragment;
    // Ensure the fragment was created successfully.
    expect(postResponse.status).toBe(201);
    // Extract the fragment ID.
    const fragmentId = fragmentMetaData.id;
    // Delete the fragment using valid credentials.
    const deleteResponse = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');
    // Verify that the fragment was deleted successfully.
    expect(deleteResponse.status).toBe(200);
  });

  // Authorized users should not be able to delete a fragment with an invalid ID.
  test('Authorized users should not be able to delete a fragment with an invalid ID.', async () => {
    // Attempt to delete a fragment using an invalid ID.
    const fragmentId = 1234;
    const deleteResponse = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain');
    // Verify that the fragment was not found.
    expect(deleteResponse.status).toBe(404);
  });
});
