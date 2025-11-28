#!/bin/bash

# twieo.service 파일 수정
cat > /etc/systemd/system/twieo.service << 'EOF'
[Unit]
Description=Twieo API Server
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/twieo/backend
Environment="PATH=/root/twieo/backend/venv/bin"
EnvironmentFile=/root/twieo/backend/.env
ExecStart=/root/twieo/backend/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# systemd 재로드 및 서비스 재시작
systemctl daemon-reload
systemctl restart twieo
systemctl status twieo
