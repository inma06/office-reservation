import { config } from 'dotenv';
config(); // .env 파일 로드

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

/**
 * 테스트용 사용자 200명을 생성하는 시드 스크립트
 * 
 * 실행 방법:
 * npm run seed:users
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const SALT = 'bongho';
  const TEST_PASSWORD = 'test1234'; // 테스트용 공통 비밀번호
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD + SALT, saltRounds);

  const TARGET_COUNT = 200;
  const BATCH_SIZE = 50; // 한 번에 처리할 사용자 수

  console.log('🌱 사용자 데이터 시딩을 시작합니다...');
  console.log(`📊 목표: ${TARGET_COUNT}명의 사용자 생성`);
  console.log(`🔐 테스트 비밀번호: ${TEST_PASSWORD}`);

  let createdCount = 0;
  let skippedCount = 0;

  // 기존 사용자 이메일 목록 가져오기 (TypeORM Repository 직접 사용)
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const existingUsers = await userRepository.find({ select: ['email'] });
  const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

  console.log(`📋 기존 사용자 수: ${existingUsers.length}명`);

  // 배치 단위로 사용자 생성
  const batches = Math.ceil(TARGET_COUNT / BATCH_SIZE);
  
  for (let batch = 0; batch < batches; batch++) {
    const usersToCreate: Partial<User>[] = [];
    const batchStart = batch * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, TARGET_COUNT);
    const batchSize = batchEnd - batchStart;

    console.log(`\n📦 배치 ${batch + 1}/${batches} 처리 중... (${batchStart + 1}~${batchEnd}번)`);

    // 배치 내에서 고유한 이메일 생성
    for (let i = 0; i < batchSize; i++) {
      let email: string;
      let attempts = 0;
      const maxAttempts = 100; // 무한 루프 방지

      // 중복되지 않는 이메일 생성
      do {
        email = faker.internet.email().toLowerCase();
        attempts++;
      } while (existingEmails.has(email) && attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        console.warn(`⚠️  고유한 이메일 생성 실패 (${i + 1}번째)`);
        continue;
      }

      existingEmails.add(email); // 생성된 이메일을 Set에 추가하여 중복 방지

      const userData: Partial<User> = {
        email,
        password: hashedPassword,
        name: faker.person.fullName(),
        role: UserRole.USER, // 기본 역할은 USER
      };

      usersToCreate.push(userData);
    }

    // 배치 단위로 사용자 생성 (개별 처리로 중복 체크)
    for (const userData of usersToCreate) {
      try {
        // DB에 저장하기 전에 다시 한 번 체크 (동시성 문제 방지)
        const existingUser = await usersService.findByEmail(userData.email!);
        if (existingUser) {
          console.log(`⏭️  ${userData.email}는 이미 존재합니다. 건너뜁니다.`);
          skippedCount++;
          continue;
        }

        await usersService.create(userData);
        createdCount++;
        
        if (createdCount % 10 === 0) {
          process.stdout.write(`✅ ${createdCount}명 생성 완료...\r`);
        }
      } catch (error: any) {
        // 중복 키 에러는 무시 (동시성 문제로 인한 중복 가능)
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          console.log(`⏭️  ${userData.email}는 이미 존재합니다. 건너뜁니다.`);
          skippedCount++;
        } else {
          console.error(`❌ ${userData.email} 생성 실패:`, error.message);
        }
      }
    }

    console.log(`✅ 배치 ${batch + 1} 완료 (현재까지 ${createdCount}명 생성)`);
  }

  console.log('\n✨ 시딩 작업이 완료되었습니다!');
  console.log(`📊 통계:`);
  console.log(`   - 생성된 사용자: ${createdCount}명`);
  console.log(`   - 건너뛴 사용자: ${skippedCount}명`);
  console.log(`   - 총 처리: ${createdCount + skippedCount}명`);
  console.log(`\n🔐 모든 사용자의 비밀번호는 "${TEST_PASSWORD}"입니다.`);

  await app.close();
}

bootstrap().catch((error) => {
  console.error('시딩 중 오류 발생:', error);
  process.exit(1);
});
