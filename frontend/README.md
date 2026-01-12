# 회의실 예약 시스템 프론트엔드

NestJS 백엔드와 연동되는 React 기반 회의실 예약 시스템 웹 프론트엔드입니다.

## 기술 스택

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router

## 시작하기

### 설치

```bash
cd frontend
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

### 빌드

```bash
npm run build
```

## 주요 기능

- JWT 기반 인증 (로그인/회원가입)
- 회의실 목록 조회
- 회의실 예약 (시작시간, 종료시간 선택)
- 예약 내역 조회
- Blue & White 테마의 깔끔한 UI

## 환경 변수

`.env` 파일을 생성하여 다음 변수를 설정할 수 있습니다:

```
# 개발 환경
VITE_API_BASE_URL=http://localhost:3000

# 프로덕션 환경
VITE_API_BASE_URL=https://dev-leo.site/api
```

## 프로젝트 구조

```
frontend/
├── src/
│   ├── api/          # API 클라이언트 및 서비스
│   ├── components/   # 재사용 가능한 컴포넌트
│   ├── pages/        # 페이지 컴포넌트
│   ├── types/        # TypeScript 타입 정의
│   ├── App.tsx       # 메인 앱 컴포넌트
│   ├── main.tsx      # 진입점
│   └── index.css     # 전역 스타일
├── package.json
└── vite.config.ts
```

