from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import sys
import os

# 프로젝트 루트를 경로에 추가하여 database, models 등을 임포트할 수 있게 합니다.
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# database.py에서 최종 결정된 데이터베이스 설정을 가져옵니다.
# 이 방식은 어떤 환경(로컬/서버)이든 일관된 설정을 보장합니다.
from database import SQLALCHEMY_DATABASE_URL, Base
import models

# Alembic 설정 객체
config = context.config

# database.py에서 가져온 최종 URL을 Alembic 설정에 주입합니다.
# 이렇게 하면 .env 파일이나 환경 변수를 직접 읽을 필요가 없습니다.
if SQLALCHEMY_DATABASE_URL:
    config.set_main_option('sqlalchemy.url', SQLALCHEMY_DATABASE_URL)
else:
    # 로컬 테스트 등에서 DATABASE_URL이 없을 경우를 대비해, ini 파일의 설정을 사용합니다.
    pass

# 모델의 메타데이터를 Alembic의 타겟으로 설정합니다.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """오프라인 모드에서 마이그레이션을 실행합니다."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # SQLite를 위한 추가 설정
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """온라인 모드에서 마이그레이션을 실행합니다."""
    # database.py에서 설정된 엔진을 사용합니다.
    connectable = config.attributes.get("connection", None)
    if connectable is None:
        from database import engine
        connectable = engine

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            # SQLite를 위한 추가 설정
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
