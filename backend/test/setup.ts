import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { StorageService } from '../src/common/storage/storage.service';
import { MailService } from '../src/modules/mail/mail.service';

// Mock Config to override DB settings for test
process.env.DB_DATABASE = 'gia_pha_db_test';
process.env.PORT = '3001';

export class TestSetup {
  public app: INestApplication;
  public dataSource: DataSource;
  public moduleFixture: TestingModule;

  async init() {
    this.moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue({
        uploadImage: jest.fn().mockResolvedValue('http://mock-image-url.com'),
        deleteImage: jest.fn().mockResolvedValue(true),
      })
      .overrideProvider(MailService)
      .useValue({
        sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
      })
      .compile();

    this.app = this.moduleFixture.createNestApplication();
    this.app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await this.app.init();

    this.dataSource = this.app.get<DataSource>(DataSource);
  }

  async close() {
    if (this.app) {
      await this.app.close();
    }
  }

  async clearDatabase() {
    if (!this.dataSource) return;
    const entities = this.dataSource.entityMetadatas;
    if (entities.length === 0) return;
    const tableNames = entities
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');
    await this.dataSource.query(`TRUNCATE TABLE ${tableNames} CASCADE;`);
  }
}

export const testSetup = new TestSetup();

beforeAll(async () => {
  await testSetup.init();
});

afterAll(async () => {
  await testSetup.close();
});
