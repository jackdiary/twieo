-- 완전한 데이터베이스 스키마 수정
-- models.py와 100% 일치하도록 수정

BEGIN;

-- ============================================
-- 1. ACHIEVEMENTS 테이블 수정
-- ============================================
\echo '=== Fixing achievements table ==='

-- 컬럼 이름 변경
ALTER TABLE achievements 
  RENAME COLUMN condition_type TO requirement_type;

ALTER TABLE achievements 
  RENAME COLUMN condition_value TO requirement_value;

-- color 컬럼이 없으면 추가 (이미 있으면 무시)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='achievements' AND column_name='color'
  ) THEN
    ALTER TABLE achievements ADD COLUMN color VARCHAR(20) DEFAULT '#4CAF50';
  END IF;
END $$;

-- description을 NOT NULL로 변경하고 기본값 설정
UPDATE achievements SET description = '업적 달성' WHERE description IS NULL;
ALTER TABLE achievements ALTER COLUMN description SET NOT NULL;

-- icon을 NOT NULL로 변경하고 기본값 설정  
UPDATE achievements SET icon = '🏆' WHERE icon IS NULL;
ALTER TABLE achievements ALTER COLUMN icon SET NOT NULL;

-- color를 NOT NULL로 변경
UPDATE achievements SET color = '#4CAF50' WHERE color IS NULL;
ALTER TABLE achievements ALTER COLUMN color SET NOT NULL;

\echo '✓ achievements table fixed'

-- ============================================
-- 2. CHALLENGES 테이블 수정
-- ============================================
\echo '=== Fixing challenges table ==='

-- creator_id 컬럼 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='challenges' AND column_name='creator_id'
  ) THEN
    ALTER TABLE challenges ADD COLUMN creator_id INTEGER REFERENCES users(id);
    -- 기존 데이터에 대해 첫 번째 사용자를 creator로 설정
    UPDATE challenges SET creator_id = (SELECT MIN(id) FROM users) WHERE creator_id IS NULL;
    ALTER TABLE challenges ALTER COLUMN creator_id SET NOT NULL;
  END IF;
END $$;

-- is_active 컬럼 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='challenges' AND column_name='is_active'
  ) THEN
    ALTER TABLE challenges ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- 컬럼 이름 변경
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='challenges' AND column_name='goal'
  ) THEN
    ALTER TABLE challenges RENAME COLUMN goal TO target_value;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='challenges' AND column_name='goal_type'
  ) THEN
    ALTER TABLE challenges RENAME COLUMN goal_type TO challenge_type;
  END IF;
END $$;

-- start_date를 TIMESTAMP로 변경
ALTER TABLE challenges ALTER COLUMN start_date TYPE TIMESTAMP USING start_date::TIMESTAMP;
ALTER TABLE challenges ALTER COLUMN start_date SET DEFAULT NOW();

-- end_date를 TIMESTAMP로 변경
ALTER TABLE challenges ALTER COLUMN end_date TYPE TIMESTAMP USING end_date::TIMESTAMP;

\echo '✓ challenges table fixed'

-- ============================================
-- 3. CHALLENGE_PARTICIPANTS 테이블 수정
-- ============================================
\echo '=== Fixing challenge_participants table ==='

-- current_value 기본값 설정
ALTER TABLE challenge_participants ALTER COLUMN current_value SET DEFAULT 0.0;
UPDATE challenge_participants SET current_value = 0.0 WHERE current_value IS NULL;

\echo '✓ challenge_participants table fixed'

-- ============================================
-- 4. GOALS 테이블 확인 (이미 수정됨)
-- ============================================
\echo '=== Checking goals table ==='

-- end_date를 TIMESTAMP로 변경
ALTER TABLE goals ALTER COLUMN start_date TYPE TIMESTAMP USING start_date::TIMESTAMP;
ALTER TABLE goals ALTER COLUMN start_date SET DEFAULT NOW();

ALTER TABLE goals ALTER COLUMN end_date TYPE TIMESTAMP USING end_date::TIMESTAMP;

\echo '✓ goals table checked'

-- ============================================
-- 5. RUNS 테이블 수정
-- ============================================
\echo '=== Fixing runs table ==='

-- date를 TIMESTAMP로 변경
ALTER TABLE runs ALTER COLUMN date TYPE TIMESTAMP USING date::TIMESTAMP;
ALTER TABLE runs ALTER COLUMN date SET DEFAULT NOW();

-- weather를 STRING으로 변경 (JSON에서)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='runs' AND column_name='weather' AND data_type='json'
  ) THEN
    ALTER TABLE runs ALTER COLUMN weather TYPE VARCHAR USING weather::TEXT;
  END IF;
END $$;

\echo '✓ runs table fixed'

-- ============================================
-- 6. USER_ACHIEVEMENTS 테이블 수정
-- ============================================
\echo '=== Fixing user_achievements table ==='

-- id 컬럼 추가 (Primary Key를 복합키에서 단일키로 변경)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='user_achievements' AND column_name='id'
  ) THEN
    -- 기존 Primary Key 제거
    ALTER TABLE user_achievements DROP CONSTRAINT user_achievements_pkey;
    
    -- id 컬럼 추가
    ALTER TABLE user_achievements ADD COLUMN id SERIAL PRIMARY KEY;
    
    -- 유니크 제약조건 추가
    ALTER TABLE user_achievements ADD CONSTRAINT user_achievements_user_achievement_unique 
      UNIQUE (user_id, achievement_id);
  END IF;
END $$;

\echo '✓ user_achievements table fixed'

-- ============================================
-- 7. FRIENDSHIPS 테이블 수정
-- ============================================
\echo '=== Fixing friendships table ==='

-- status 기본값 설정
ALTER TABLE friendships ALTER COLUMN status SET DEFAULT 'pending';
UPDATE friendships SET status = 'pending' WHERE status IS NULL;

-- created_at 기본값 설정
ALTER TABLE friendships ALTER COLUMN created_at SET DEFAULT NOW();
UPDATE friendships SET created_at = NOW() WHERE created_at IS NULL;

\echo '✓ friendships table fixed'

-- ============================================
-- 8. 인덱스 추가 (성능 향상)
-- ============================================
\echo '=== Adding indexes ==='

CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_date ON runs(date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_challenges_creator_id ON challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_challenges_is_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

\echo '✓ indexes added'

COMMIT;

-- ============================================
-- 9. 최종 확인
-- ============================================
\echo ''
\echo '=== FINAL SCHEMA CHECK ==='
\echo ''

\echo 'ACHIEVEMENTS:'
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'achievements' 
ORDER BY ordinal_position;

\echo ''
\echo 'CHALLENGES:'
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'challenges' 
ORDER BY ordinal_position;

\echo ''
\echo 'GOALS:'
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;

\echo ''
\echo '=== SCHEMA FIX COMPLETE ==='
