from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# 우리 프로젝트의 모델과 데이터베이스 설정을 가져옵니다.
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from database import SQLALCHEMY_DATABASE_URL, Base
import models

# Alembic 설정 객체, 데이터베이스 URL을 우리 프로젝트의 것으로 설정합니다.
config = context.config
config.set_main_option('sqlalchemy.url', str(SQLALCHEMY_DATABASE_URL))

# fileConfig(config.config_file_name)

# 모델의 메타데이터를 가져옵니다.
target_metadata = Base.metadata

def run_migrations_offline():
    """오프라인 모드에서 마이그레이션을 실행합니다."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """온라인 모드에서 마이그레이션을 실행합니다."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
