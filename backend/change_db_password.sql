-- PostgreSQL 비밀번호 변경 스크립트
-- 실행 방법: psql -U postgres -f change_db_password.sql

-- twieo_user 비밀번호 변경
ALTER USER twieo_user WITH PASSWORD '6@H^LA854Jb&wtMR5ryD0KLk';

-- 변경 확인
\du twieo_user
