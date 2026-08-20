import request from 'supertest';
import { testSetup } from './setup';

describe('RequestsController (e2e)', () => {
  const app = () => testSetup.app.getHttpServer();
  let adminToken: string;
  let userToken: string;
  let familyId: number;
  let targetMemberId: number;
  let joinRequestId: number;

  beforeAll(async () => {
    await testSetup.clearDatabase();

    // Register admin user
    const adminRes = await request(app())
      .post('/auth/register')
      .send({
        username: 'admin_user',
        password: 'password123',
        member: { fullName: 'Admin' },
      });
    adminToken = adminRes.body.accessToken;

    // Create family
    const familyRes = await request(app())
      .post('/families')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Request Family' })
      .expect(201);
    familyId = familyRes.body.id;

    // Create a target member to join
    const memberRes = await request(app())
      .post(`/families/${familyId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Target Member', gender: 'male' })
      .expect(201);
    targetMemberId = memberRes.body.id;

    // Register a normal user who wants to join
    const userRes = await request(app())
      .post('/auth/register')
      .send({
        username: 'normal_user',
        password: 'password123',
        member: { fullName: 'Normal' },
      });
    userToken = userRes.body.accessToken;
  });

  const adminAuth = () => ['Authorization', `Bearer ${adminToken}`] as const;
  const userAuth = () => ['Authorization', `Bearer ${userToken}`] as const;

  it('/join-requests (POST) - create join request', async () => {
    const res = await request(app())
      .post('/join-requests')
      .set(...userAuth())
      .send({
        familyId,
        targetMemberId,
        note: 'I am Target Member',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.familyId).toBe(familyId);
    expect(res.body.status).toBe('PENDING');
    joinRequestId = res.body.id;
  });

  it('/families/:familyId/join-requests (GET) - list join requests', async () => {
    const res = await request(app())
      .get(`/families/${familyId}/join-requests`)
      .set(...adminAuth())
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].id).toBe(joinRequestId);
  });
});
