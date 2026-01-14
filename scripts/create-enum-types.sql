-- users_role_enum 타입 생성
-- 이미 존재하는 경우 오류를 무시하기 위해 IF NOT EXISTS 사용
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
        CREATE TYPE "users_role_enum" AS ENUM ('USER', 'ADMIN');
        RAISE NOTICE 'users_role_enum 타입이 생성되었습니다.';
    ELSE
        RAISE NOTICE 'users_role_enum 타입이 이미 존재합니다.';
    END IF;
END $$;

-- reservations_status_enum 타입 생성
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservations_status_enum') THEN
        CREATE TYPE "reservations_status_enum" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELED');
        RAISE NOTICE 'reservations_status_enum 타입이 생성되었습니다.';
    ELSE
        RAISE NOTICE 'reservations_status_enum 타입이 이미 존재합니다.';
    END IF;
END $$;

-- 확인 쿼리: 생성된 enum 타입 확인
SELECT typname, typtype 
FROM pg_type 
WHERE typname IN ('users_role_enum', 'reservations_status_enum')
ORDER BY typname;
