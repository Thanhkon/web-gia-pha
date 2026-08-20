import request from 'supertest';
import { testSetup } from './setup';

describe('AppController (e2e)', () => {
  it('/ (GET)', () => {
    return request(testSetup.app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
