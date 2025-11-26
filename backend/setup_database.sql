-- 뛰어 (Twieo) 데이터베이스 설정

-- 데이터베이스 생성
CREATE DATABASE twieo_db;

-- 사용자 생성 (비밀번호는 나중에 변경하세요)
CREATE USER twieo_user WITH PASSWORD 'twieo2024!';

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE twieo_db TO twieo_user;

-- 연결 확인
\c twieo_db

-- 스키마 권한 부여
GRANT ALL PRIVILEGES ON SCHEMA public TO twieo_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO twieo_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO twieo_user;

-- 기본 권한 설정
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO twieo_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO twieo_user;
