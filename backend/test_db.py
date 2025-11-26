"""데이터베이스 연결 테스트"""
from database import engine, SessionLocal
from models import Base
import models

def test_connection():
    """데이터베이스 연결 테스트"""
    try:
        # 연결 테스트
        with engine.connect() as connection:
            print("✅ 데이터베이스 연결 성공!")
            print(f"   연결 정보: {engine.url}")
        
        # 테이블 생성
        print("\n📊 테이블 생성 중...")
        Base.metadata.create_all(bind=engine)
        print("✅ 테이블 생성 완료!")
        
        # 생성된 테이블 확인
        print("\n📋 생성된 테이블:")
        for table in Base.metadata.tables.keys():
            print(f"   - {table}")
        
        # 세션 테스트
        db = SessionLocal()
        try:
            # 사용자 수 확인
            user_count = db.query(models.User).count()
            print(f"\n👤 현재 사용자 수: {user_count}")
            print("\n✅ 모든 테스트 통과!")
        finally:
            db.close()
            
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        return False
    
    return True

if __name__ == "__main__":
    test_connection()
