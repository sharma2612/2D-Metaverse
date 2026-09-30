#!/bin/bash
# Chunk sizes as shipped inside the image.
docker run --rm --entrypoint sh 2d-metaverse:local -c 'ls -l /app/dist/assets/*.js'