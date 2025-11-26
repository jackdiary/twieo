# 데이터베이스 비밀번호 변경 가이드

## ✅ 완료된 작업
- [x] 새로운 강력한 비밀번호 생성
- [x] backend/.env 파일 업데이트
- [x] SQL 스크립트 생성

## 📝 새로운 비밀번호
```
6@H^LA854Jb&wtMR5ryD0KLk
```

⚠️ **중요**: 이 비밀번호를 안전한 곳에 보관하세요!

---

## 🔧 PostgreSQL 비밀번호 변경 방법

### 방법 1: SQL 스크립트 사용 (권장)

```bash
# PostgreSQL에 postgres 사용자로 접속하여 스크립트 실행
psql -U postgres -f backend/change_db_password.sql
```

### 방법 2: 직접 명령어 실행

```bash
# 1. PostgreSQL 접속
psql -U postgres

# 2. 비밀번호 변경
ALTER USER twieo_user WITH PASSWORD '6@H^LA854Jb&wtMR5ryD0KLk';

# 3. 변경 확인
\du twieo_user

# 4. 종료
\q
```

### 방법 3: pgAdmin 사용 (GUI)

1. pgAdmin 실행
2. Servers → PostgreSQL → Login/Group Roles → twieo_user 우클릭
3. Properties → Definition
4. Password 입력: `6@H^LA854Jb&wtMR5ryD0KLk`
5. Save

---

## ✅ 변경 후 테스트

### 1. 연결 테스트
```bash
# 새 비밀번호로 연결 테스트
psql -U twieo_user -d twieo_db -h localhost

# 비밀번호 입력: 6@H^LA854Jb&wtMR5ryD0KLk
# 성공하면 twieo_db=> 프롬프트가 나타남
```

### 2. 백엔드 서버 재시작
```bash
# 현재 서버 중지 (Ctrl+C)

cd backend
venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. API 테스트
```bash
# 서버 응답 확인
curl http://localhost:8000/

# 데이터베이스 연결 확인 (회원가입 테스트)
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test1234!"}'
```

---

## 🚨 문제 해결

### 에러: "password authentication failed"

**원인**: PostgreSQL에서 비밀번호가 아직 변경되지 않음

**해결**:
```bash
# PostgreSQL에서 비밀번호 변경
psql -U postgres
ALTER USER twieo_user WITH PASSWORD '6@H^LA854Jb&wtMR5ryD0KLk';
\q
```

### 에러: "could not connect to server"

**원인**: PostgreSQL 서비스가 실행되지 않음

**해결**:
```bash
# Windows
net start postgresql-x64-14

# 또는 서비스 관리자에서 PostgreSQL 시작
```

### 에러: "peer authentication failed"

**원인**: pg_hba.conf 설정 문제

**해결**:
1. `C:\Program Files\PostgreSQL\14\data\pg_hba.conf` 열기
2. 다음 라인 찾기:
   ```
   host    all             all             127.0.0.1/32            md5
   ```
3. PostgreSQL 재시작

---

## 📋 체크리스트

### 변경 전
- [x] 새 비밀번호 생성
- [x] .env 파일 업데이트
- [x] SQL 스크립트 준비

### 변경 작업
- [ ] PostgreSQL에서 비밀번호 변경 실행
- [ ] 변경 확인

### 변경 후
- [ ] 연결 테스트
- [ ] 백엔드 서버 재시작
- [ ] API 테스트
- [ ] 기능 테스트 (로그인, 회원가입 등)

---

## 🔒 보안 주의사항

1. **비밀번호 보관**
   - 안전한 비밀번호 관리자 사용
   - 절대 Git에 커밋하지 말 것
   - 팀원과 공유 시 암호화된 채널 사용

2. **.env 파일 보안**
   - .gitignore에 포함 확인
   - 서버에만 존재하도록 관리
   - 정기적으로 비밀번호 변경

3. **백업**
   - 비밀번호 변경 전 데이터베이스 백업
   ```bash
   pg_dump -U postgres twieo_db > backup_$(date +%Y%m%d).sql
   ```

---

## ✅ 완료 확인

모든 테스트가 성공하면 2단계 완료!

**다음 단계**: 3단계 - CORS 도메인 설정

현재 진행률: **2/7 단계 완료 (29%)**
