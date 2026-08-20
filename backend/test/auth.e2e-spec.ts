import request from 'supertest';
import { testSetup } from './setup';

describe('AuthController (e2e)', () => {
  const app = () => testSetup.app.getHttpServer();

  beforeEach(async () => {
    await testSetup.clearDatabase();
  });

  const registerDto = {
    username: 'testuser',
    password: 'password123',
    member: {
      fullName: 'Test User',
      gender: 'male',
      dateOfBirth: '2000-01-01T00:00:00Z',
    },
  };

  it('/auth/register (POST) - success', async () => {
    const res = await request(app())
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe(registerDto.username);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('/auth/register (POST) - conflict', async () => {
    await request(app()).post('/auth/register').send(registerDto).expect(201);

    const res = await request(app())
      .post('/auth/register')
      .send(registerDto)
      .expect(409);

    expect(res.body.message).toContain('Username');
  });

  it('/auth/login (POST) - success', async () => {
    await request(app()).post('/auth/register').send(registerDto).expect(201);

    const res = await request(app())
      .post('/auth/login')
      .send({
        username: registerDto.username,
        password: registerDto.password,
      })
      .expect(201);

    expect(res.body.user).toBeDefined();
    expect(res.body.accessToken).toBeDefined();
  });

  it('/auth/login (POST) - wrong password', async () => {
    await request(app()).post('/auth/register').send(registerDto).expect(201);

    await request(app())
      .post('/auth/login')
      .send({
        username: registerDto.username,
        password: 'wrongpassword',
      })
      .expect(401);
  });
});
