-- user_profiles 테이블에 full_name 컬럼 추가
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);

-- 확인
\d user_profiles
