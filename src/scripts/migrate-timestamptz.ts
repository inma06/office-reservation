import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { getDataSourceToken } from '@nestjs/typeorm';

/**
 * reservations 테이블의 startAt, endAt 컬럼을
 * timestamp에서 timestamptz로 안전하게 마이그레이션하는 스크립트
 * 
 * 실행 방법:
 * ts-node -r tsconfig-paths/register src/scripts/migrate-timestamptz.ts
 */
async function migrateTimestampToTimestamptz() {
  // NestJS 애플리케이션 컨텍스트 없이 직접 DataSource 생성
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'reservation_db',
  });

  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 기존 컬럼 타입 확인
      const startAtInfo = await queryRunner.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'reservations' AND column_name = 'startAt'
      `);

      const endAtInfo = await queryRunner.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'reservations' AND column_name = 'endAt'
      `);

      console.log('현재 startAt 타입:', startAtInfo[0]?.data_type);
      console.log('현재 endAt 타입:', endAtInfo[0]?.data_type);

      // 이미 timestamptz인 경우 스킵
      if (startAtInfo[0]?.data_type === 'timestamp with time zone') {
        console.log('⚠️  startAt은 이미 timestamptz 타입입니다. 스킵합니다.');
      } else {
        console.log('🔄 startAt 컬럼을 timestamptz로 변경 중...');
        // PostgreSQL은 timestamp를 timestamptz로 변환할 때 자동으로 UTC로 해석
        await queryRunner.query(`
          ALTER TABLE reservations 
          ALTER COLUMN "startAt" TYPE TIMESTAMP WITH TIME ZONE 
          USING "startAt"::timestamptz
        `);
        console.log('✅ startAt 컬럼 변경 완료');
      }

      if (endAtInfo[0]?.data_type === 'timestamp with time zone') {
        console.log('⚠️  endAt은 이미 timestamptz 타입입니다. 스킵합니다.');
      } else {
        console.log('🔄 endAt 컬럼을 timestamptz로 변경 중...');
        await queryRunner.query(`
          ALTER TABLE reservations 
          ALTER COLUMN "endAt" TYPE TIMESTAMP WITH TIME ZONE 
          USING "endAt"::timestamptz
        `);
        console.log('✅ endAt 컬럼 변경 완료');
      }

      await queryRunner.commitTransaction();
      console.log('✅ 마이그레이션 완료!');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ 마이그레이션 실패:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  migrateTimestampToTimestamptz()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export { migrateTimestampToTimestamptz };
