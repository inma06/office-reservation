import { config } from 'dotenv';
config(); // .env 파일 로드

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RoomsService } from '../rooms/rooms.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const roomsService = app.get(RoomsService);

  const rooms = [
    {
      name: '회의실 A',
      capacity: 10,
      description: '대형 회의실, 프로젝터 및 화이트보드 완비',
      isActive: true,
    },
    {
      name: '회의실 B',
      capacity: 5,
      description: '소형 회의실, 팀 미팅에 적합',
      isActive: true,
    },
    {
      name: '회의실 C',
      capacity: 20,
      description: '대형 세미나실, 프레젠테이션 및 워크샵용',
      isActive: true,
    },
    {
      name: '회의실 D',
      capacity: 8,
      description: '중형 회의실, 화상회의 시스템 완비',
      isActive: true,
    },
    {
      name: '회의실 E',
      capacity: 15,
      description: '중대형 회의실, 다목적 공간',
      isActive: true,
    },
    {
      name: '비즈니스룸 101',
      capacity: 4,
      description: '소규모 미팅룸, 원탁 테이블 및 모니터 완비',
      isActive: true,
    },
    {
      name: '비즈니스룸 102',
      capacity: 6,
      description: '중소형 회의실, TV 화면 및 화이트보드',
      isActive: true,
    },
    {
      name: '세미나홀',
      capacity: 50,
      description: '대형 세미나홀, 무대 및 음향 시스템 완비',
      isActive: true,
    },
    {
      name: '프레젠테이션룸',
      capacity: 25,
      description: '프레젠테이션 전용 공간, 대형 스크린 및 프로젝터',
      isActive: true,
    },
    {
      name: '소회의실 201',
      capacity: 3,
      description: '1:1 면담 및 소규모 미팅 공간',
      isActive: true,
    },
    {
      name: '소회의실 202',
      capacity: 3,
      description: '1:1 면담 및 소규모 미팅 공간',
      isActive: true,
    },
    {
      name: '중회의실 301',
      capacity: 12,
      description: '중형 회의실, 원형 테이블 및 화상회의 장비',
      isActive: true,
    },
    {
      name: '중회의실 302',
      capacity: 12,
      description: '중형 회의실, 원형 테이블 및 화상회의 장비',
      isActive: true,
    },
    {
      name: '대회의실 401',
      capacity: 30,
      description: '대형 회의실, 강당형 배치 및 프로젝터 2대',
      isActive: true,
    },
    {
      name: '대회의실 402',
      capacity: 30,
      description: '대형 회의실, 강당형 배치 및 프로젝터 2대',
      isActive: true,
    },
    {
      name: '워크숍룸',
      capacity: 18,
      description: '워크숍 전용 공간, 그룹 테이블 및 마커보드',
      isActive: true,
    },
    {
      name: '브레인스토밍룸',
      capacity: 8,
      description: '창의적 아이디어 회의실, 벽면 화이트보드 다수',
      isActive: true,
    },
    {
      name: 'VIP 회의실',
      capacity: 10,
      description: 'VIP 전용 회의실, 고급 시설 및 커피 서비스',
      isActive: true,
    },
    {
      name: '화상회의실',
      capacity: 6,
      description: '화상회의 전용 공간, 고화질 카메라 및 마이크',
      isActive: true,
    },
    {
      name: '다목적실',
      capacity: 40,
      description: '다목적 대형 공간, 세미나 및 이벤트 가능',
      isActive: true,
    },
  ];

  console.log('🌱 회의실 데이터 시딩을 시작합니다...');

  // 기존 회의실 목록 가져오기
  const existingRooms = await roomsService.findAll();
  const existingRoomNames = new Set(existingRooms.map((r) => r.name));

  for (const roomData of rooms) {
    try {
      if (existingRoomNames.has(roomData.name)) {
        console.log(`⏭️  ${roomData.name}는 이미 존재합니다. 건너뜁니다.`);
      } else {
        await roomsService.create(roomData);
        console.log(`✅ ${roomData.name} 생성 완료`);
      }
    } catch (error) {
      console.error(`❌ ${roomData.name} 생성 실패:`, error);
    }
  }

  console.log('✨ 시딩 작업이 완료되었습니다!');
  await app.close();
}

bootstrap().catch((error) => {
  console.error('시딩 중 오류 발생:', error);
  process.exit(1);
});

