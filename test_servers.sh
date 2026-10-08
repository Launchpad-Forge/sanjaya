#!/bin/bash
echo "Testing health endpoints..."
cd /home/netha/Projects/sanjaya
npm run dev > server_logs.txt 2>&1 &
NPM_PID=$!

cd engine
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000 > engine_logs.txt 2>&1 &
UVICORN_PID=$!

sleep 5

curl -s http://localhost:3000/api/health || echo "Server health failed"
curl -s http://localhost:8000/health || echo "Engine health failed"

kill $NPM_PID
kill $UVICORN_PID
