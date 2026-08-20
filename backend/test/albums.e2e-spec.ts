import request from 'supertest';
import { testSetup } from './setup';

describe('AlbumsController (e2e)', () => {
  const app = () => testSetup.app.getHttpServer();
  let accessToken: string;
  let familyId: number;

  beforeAll(async () => {
    await testSetup.clearDatabase();

    // Register a user
    const authRes = await request(app())
      .post('/auth/register')
      .send({
        username: 'album_user',
        password: 'password123',
        member: {
          fullName: 'Album Tester',
        },
      });
    accessToken = authRes.body.accessToken;

    // Create a family
    const familyRes = await request(app())
      .post('/families')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Album Family' })
      .expect(201);
    familyId = familyRes.body.id;
  });

  const authHeader = () => ['Authorization', `Bearer ${accessToken}`] as const;

  it('/families/:familyId/albums (POST) - create album', async () => {
    const res = await request(app())
      .post(`/families/${familyId}/albums`)
      .set(...authHeader())
      .send({
        title: 'Tet Holiday 2026',
        description: 'Photos from Tet 2026',
        visibility: 'INTERNAL',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('Tet Holiday 2026');
    expect(res.body.familyId).toBe(familyId);
  });

  it('/families/:familyId/albums (GET) - list albums', async () => {
    const res = await request(app())
      .get(`/families/${familyId}/albums`)
      .set(...authHeader())
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].title).toBe('Tet Holiday 2026');
  });
});
