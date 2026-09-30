#!/bin/bash
# Diagnose why the container build cannot resolve firebase/auth.
LOCK=/mnt/c/Users/sumit/projec/2d-metaverse/2d_metaverse/package-lock.json
echo "=== declared in package.json ==="
grep 'firebase' /mnt/c/Users/sumit/projec/2d-metaverse/2d_metaverse/package.json
echo
echo "=== @firebase/auth in lockfile ==="
grep -n 'node_modules/@firebase/auth' "$LOCK" | head -3
echo
echo "=== lockfile version ==="
grep -m1 'lockfileVersion' "$LOCK"
echo
echo "=== is @firebase/auth a root dep in lock? ==="
node -e '
const lock = require("/mnt/c/Users/sumit/projec/2d-metaverse/2d_metaverse/package-lock.json");
const root = lock.packages && lock.packages[""];
console.log("root deps has @firebase/auth:", root && root.dependencies ? "@firebase/auth" in root.dependencies : "n/a");
console.log("root deps has firebase:", root && root.dependencies ? "firebase" in root.dependencies : "n/a");
console.log("installed entry:", !!lock.packages["node_modules/@firebase/auth"]);
'