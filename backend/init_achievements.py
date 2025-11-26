"""
업적 초기 데이터 생성
"""
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models

# 데이터베이스 테이블 생성
models.Base.metadata.create_all(bind=engine)

def init_achievements():
    db = SessionLocal()
    
    # 기존 업적 확인
    existing = db.query(models.Achievement).count()
    if existing > 0:
        print(f"이미 {existing}개의 업적이 존재합니다.")
        db.close()
        return
    
    achievements = [
        # 거리 기반
        {"name": "첫 걸음", "description": "첫 러닝 완료", "icon": "footsteps", "color": "#4CAF50", "requirement_type": "runs", "requirement_value": 1},
        {"name": "5km 달성", "description": "5km 달리기 완료", "icon": "medal", "color": "#FFD700", "requirement_type": "distance", "requirement_value": 5},
        {"name": "10km 달성", "description": "10km 달리기 완료", "icon": "star", "color": "#C0C0C0", "requirement_type": "distance", "requirement_value": 10},
        {"name": "하프 마라톤", "description": "21.1km 달리기 완료", "icon": "trophy", "color": "#4CAF50", "requirement_type": "distance", "requirement_value": 21.1},
        {"name": "풀 마라톤", "description": "42.195km 달리기 완료", "icon": "ribbon", "color": "#9C27B0", "requirement_type": "distance", "requirement_value": 42.195},
        
        # 누적 거리
        {"name": "50km 누적", "description": "총 50km 달성", "icon": "flame", "color": "#FF6B6B", "requirement_type": "total_distance", "requirement_value": 50},
        {"name": "100km 누적", "description": "총 100km 달성", "icon": "flame", "color": "#FF6B6B", "requirement_type": "total_distance", "requirement_value": 100},
        {"name": "200km 누적", "description": "총 200km 달성", "icon": "rocket", "color": "#42A5F5", "requirement_type": "total_distance", "requirement_value": 200},
        {"name": "500km 누적", "description": "총 500km 달성", "icon": "rocket", "color": "#42A5F5", "requirement_type": "total_distance", "requirement_value": 500},
        {"name": "1000km 누적", "description": "총 1000km 달성", "icon": "planet", "color": "#9C27B0", "requirement_type": "total_distance", "requirement_value": 1000},
        
        # 횟수 기반
        {"name": "10회 달성", "description": "10번 러닝 완료", "icon": "star", "color": "#C0C0C0", "requirement_type": "runs", "requirement_value": 10},
        {"name": "50회 달성", "description": "50번 러닝 완료", "icon": "star", "color": "#FFD700", "requirement_type": "runs", "requirement_value": 50},
        {"name": "100회 달성", "description": "100번 러닝 완료", "icon": "star", "color": "#FF6B6B", "requirement_type": "runs", "requirement_value": 100},
        
        # 속도 기반
        {"name": "스피드 러너", "description": "5분/km 이하 페이스 달성", "icon": "flash", "color": "#FFD700", "requirement_type": "pace", "requirement_value": 5.0},
        {"name": "번개", "description": "4분/km 이하 페이스 달성", "icon": "flash", "color": "#FF6B6B", "requirement_type": "pace", "requirement_value": 4.0},
        
        # 연속 기록
        {"name": "3일 연속", "description": "3일 연속 러닝", "icon": "calendar", "color": "#4CAF50", "requirement_type": "streak", "requirement_value": 3},
        {"name": "7일 연속", "description": "7일 연속 러닝", "icon": "calendar", "color": "#FFD700", "requirement_type": "streak", "requirement_value": 7},
        {"name": "30일 연속", "description": "30일 연속 러닝", "icon": "calendar", "color": "#9C27B0", "requirement_type": "streak", "requirement_value": 30},
        
        # 특별 업적
        {"name": "새벽 러너", "description": "오전 6시 이전 러닝 10회", "icon": "sunny", "color": "#FFA726", "requirement_type": "early_bird", "requirement_value": 10},
        {"name": "야행성", "description": "오후 10시 이후 러닝 10회", "icon": "moon", "color": "#42A5F5", "requirement_type": "night_owl", "requirement_value": 10},
        {"name": "비 오는 날", "description": "비 오는 날 러닝 5회", "icon": "rainy", "color": "#4ECDC4", "requirement_type": "rainy_day", "requirement_value": 5},
    ]
    
    for ach_data in achievements:
        achievement = models.Achievement(**ach_data)
        db.add(achievement)
    
    db.commit()
    print(f"{len(achievements)}개의 업적이 생성되었습니다.")
    db.close()

if __name__ == "__main__":
    init_achievements()
