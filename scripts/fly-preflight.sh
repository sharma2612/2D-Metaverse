#!/bin/bash
# Pre-flight: validates the fly config and image without contacting Fly's API.
set -u
cd /mnt/c/Users/sumit/projec/2d-metaverse

echo "=== fly.toml parses? ==="
/root/.fly/bin/flyctl config validate 2>&1 | head -5

echo
echo "=== .dockerignore: are deploy.env and Dockerfile let through? ==="
grep -q '!deploy.env' .dockerignore && echo "deploy.env explicitly un-ignored: yes" || echo "deploy.env un-ignored: NO (build will embed stale env)"
grep -q 'deploy.env' .dockerignore && echo "deploy.env referenced: yes" || echo "deploy.env referenced: NO"

echo
echo "=== local image still healthy? ==="
docker images 2d-metaverse:local --format '{{.Repository}}:{{.Tag}} {{.Size}}'

echo
echo "=== container up on localhost:5000? ==="
docker ps --filter name=2d-metaverse --format '{{.Names}} | {{.Status}}' || echo "not running"