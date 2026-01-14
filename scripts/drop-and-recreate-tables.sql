-- ⚠️ 주의: 이 스크립트는 모든 테이블을 삭제하고 다시 생성합니다.
-- 기존 데이터가 모두 삭제되므로 주의하세요!

-- 외래키 제약 조건 때문에 순서대로 삭제해야 합니다
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- enum 타입도 삭제 (필요한 경우)
DROP TYPE IF EXISTS "reservations_status_enum" CASCADE;
DROP TYPE IF EXISTS "users_role_enum" CASCADE;

-- enum 타입 재생성
CREATE TYPE "users_role_enum" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "reservations_status_enum" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELED');

-- users 테이블 생성
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    role "users_role_enum" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- rooms 테이블 생성
CREATE TABLE public.rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    capacity INTEGER NOT NULL,
    description TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- reservations 테이블 생성
CREATE TABLE public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "roomId" INTEGER NOT NULL,
    "startAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    status "reservations_status_enum" NOT NULL DEFAULT 'PENDING',
    reason TEXT,
    "isNotified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_reservations_user" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT "FK_reservations_room" FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON DELETE CASCADE
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX "IDX_reservations_userId" ON public.reservations("userId");
CREATE INDEX "IDX_reservations_roomId" ON public.reservations("roomId");
CREATE INDEX "IDX_reservations_startAt" ON public.reservations("startAt");
CREATE INDEX "IDX_reservations_endAt" ON public.reservations("endAt");
