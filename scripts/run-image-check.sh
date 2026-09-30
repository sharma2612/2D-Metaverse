#!/bin/bash
# Long-running check: boot the image, wait past the healthcheck start period,
# inspect logs, confirm health status, and confirm the DB actually connected.
set -u
NAME=mm-run
docker rm -f "$NAME" >/dev/null 2>&1

echo "=== docker run (published port 5082) ==="
docker run -d --name "$NAME" -p 5082:5000 2d-metaverse:local && sleep 3

echo
echo "=== container state ==="
docker inspect -f 'status={{.State.Status}} running={{.State.Running}} exit={{.State.ExitCode}} restarts={{.RestartCount}}' "$NAME"

echo
echo "=== startup logs ==="
docker logs "$NAME" 2>&1 | head -20

echo
echo "=== waiting 40s so HEALTHCHECK reports (start-period is 25s) ==="
sleep 40

echo
echo "=== health status ==="
docker inspect -f 'health={{.State.Health.Status}} failing_streak={{.State.Health.FailingStreak}}' "$NAME"
echo "--- last health probe output ---"
docker inspect -f '{{range .State.Health.Log}}{{.ExitCode}}: {{.Output}}{{end}}' "$NAME" 2>/dev/null | tail -4

echo
echo "=== still alive? ==="
docker inspect -f 'status={{.State.Status}}' "$NAME"

echo
echo "=== database connected? ==="
docker logs "$NAME" 2>&1 | grep -i 'database connected' || echo "NO 'Database connected' LINE"

echo
echo "=== request from host through published port ==="
curl -s -o /dev/null -w 'status=%{http_code} time=%{time_total}s\n' http://127.0.0.1:5082/
curl -s -o /dev/null -w 'deep-link status=%{http_code}\n' http://127.0.0.1:5082/room2/abc

echo
echo "=== resource snapshot ==="
docker stats --no-stream --format 'cpu={{.CPUPerc}} mem={{.MemUsage}}' "$NAME" 2>/dev/null

docker rm -f "$NAME" >/dev/null 2>&1
echo
echo "cleaned up"