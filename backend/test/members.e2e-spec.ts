import request from 'supertest';
import { testSetup } from './setup';

describe('MembersController (e2e)', () => {
  const app = () => testSetup.app.getHttpServer();
  let accessToken: string;
  let familyId: number;

  beforeAll(async () => {
    await testSetup.clearDatabase();

    // Register a user to get access token
    const res = await request(app())
      .post('/auth/register')
      .send({
        username: 'member_admin',
        password: 'password123',
        member: {
          fullName: 'Admin Member',
          gender: 'male',
        },
      });
    accessToken = res.body.accessToken;
  });

  const authHeader = () => ['Authorization', `Bearer ${accessToken}`] as const;

  it('/families (POST) - create family', async () => {
    const res = await request(app())
      .post('/families')
      .set(...authHeader())
      .send({
        name: 'Nguyen Family',
        description: 'The Nguyen family tree',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Nguyen Family');
    familyId = res.body.id;
  });

  it('/families/:familyId/members (POST) - add member', async () => {
    const res = await request(app())
      .post(`/families/${familyId}/members`)
      .set(...authHeader())
      .send({
        fullName: 'Nguyen Van A',
        gender: 'male',
        isDeceased: false,
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.fullName).toBe('Nguyen Van A');
    expect(res.body.familyId).toBe(familyId);
  });

  it('/families/:familyId/members (GET) - list members', async () => {
    const res = await request(app())
      .get(`/families/${familyId}/members`)
      .set(...authHeader())
      .expect(200);

    // Should contain the member created during registration and the new member
    expect(Array.isArray(res.body.members)).toBe(true);
    expect(res.body.members.length).toBeGreaterThanOrEqual(1);
    const memberA = res.body.members.find(
      (m: any) => m.fullName === 'Nguyen Van A',
    );
    expect(memberA).toBeDefined();
  });
});
