-- goals 테이블 스키마 수정

-- 1. 기존 컬럼 이름 변경 및 새 컬럼 추가
ALTER TABLE goals RENAME COLUMN target TO target_value;

-- 2. 누락된 컬럼 추가
ALTER TABLE goals ADD COLUMN IF NOT EXISTS current_value DOUBLE PRECISION DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS period VARCHAR(20) DEFAULT 'weekly';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- 3. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_is_completed ON goals(is_completed);

-- 4. 확인
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;
