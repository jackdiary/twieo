# 서버 로그 실시간 확인
ssh -i run.pem root@110.165.18.249 "journalctl -u twieo -f"
