# Bcrypt 오류 해결 완료

## 문제
```
AttributeError: module 'bcrypt' has no attribute '__about__'
ValueError: password cannot be longer than 72 bytes
```

## 원인
1. **passlib과 bcrypt 버전 충돌**: passlib 1.7.4가 bcrypt 5.0.0과 호환되지 않음
2. **비밀번호 길이 제한**: bcrypt는 72바이트까지만 지원

## 해결 방법

### 1. passlib 제거 및 bcrypt 직접 사용
- passlib 제거
- bcrypt 4.1.2로 다운그레이드
- auth.py에서 bcrypt 직접 사용

### 2. 비밀번호 길이 제한 처리
```python
def get_password_hash(password: str) -> str:
    # 비밀번호를 72바이트로 제한
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')
```

## 변경 사항

### backend/auth.py
- passlib.context.CryptContext 제거
- bcrypt 직접 import 및 사용
- 비밀번호 72바이트 제한 추가

### backend/requirements.txt
- `passlib[bcrypt]==1.7.4` 제거
- `bcrypt==4.1.2` 추가

## 서버 재시작
```bash
cd backend
.\venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 테스트
- 회원가입 시도
- 비밀번호 해싱 정상 작동
- 로그인 정상 작동

## 주의사항
- 72바이트 = 약 72자 (ASCII) 또는 24자 (한글 3바이트)
- 대부분의 비밀번호는 72바이트 이내
- 필요시 프론트엔드에서 비밀번호 길이 제한 추가 가능
