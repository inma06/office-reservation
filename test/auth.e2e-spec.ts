import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/entities/user.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();

    // 테스트 데이터 정리
    const userRepository = dataSource.getRepository(User);
    await userRepository
      .createQueryBuilder()
      .delete()
      .execute();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('정상적인 회원가입이 성공해야 함', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: '테스트 사용자',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', 'test@example.com');
          expect(res.body).toHaveProperty('name', '테스트 사용자');
          expect(res.body).toHaveProperty('role', 'USER');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('관리자 역할로 회원가입이 가능해야 함', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'admin1234',
          name: '관리자',
          role: 'ADMIN',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('role', 'ADMIN');
        });
    });

    it('중복된 이메일로 회원가입 시 409 에러를 반환해야 함', async () => {
      // 첫 번째 회원가입
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: '첫 번째 사용자',
        })
        .expect(201);

      // 중복 이메일로 회원가입 시도
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: '두 번째 사용자',
        })
        .expect(409);
    });

    it('잘못된 이메일 형식 시 400 에러를 반환해야 함', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: '테스트 사용자',
        })
        .expect(400);
    });

    it('비밀번호가 8자 미만이면 400 에러를 반환해야 함', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'short@example.com',
          password: 'short',
          name: '테스트 사용자',
        })
        .expect(400);
    });

    it('필수 필드가 누락되면 400 에러를 반환해야 함', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'missing@example.com',
          // password와 name이 누락됨
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      // 로그인 테스트를 위한 사용자 생성 (한 번만 실행)
      // 기존 사용자가 있을 수 있으므로 먼저 삭제 시도
      const userRepository = dataSource.getRepository(User);
      await userRepository
        .createQueryBuilder()
        .delete()
        .where('email = :email', { email: 'login@example.com' })
        .execute();

      // 사용자 생성
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'login@example.com',
          password: 'password123',
          name: '로그인 테스트 사용자',
        });
      
      // 사용자 생성 확인
      expect(response.status).toBe(201);
    });

    it('정상적인 로그인이 성공하고 access_token을 반환해야 함', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('잘못된 비밀번호로 로그인 시 401 에러를 반환해야 함', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        });
      
      expect(response.status).toBe(401);
    });

    it('존재하지 않는 이메일로 로그인 시 401 에러를 반환해야 함', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'notfound@example.com',
          password: 'password123',
        });
      
      expect(response.status).toBe(401);
    });
  });
});

