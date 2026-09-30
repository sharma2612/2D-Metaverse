#!/bin/bash
# Sanity check that runc can actually start a container now.
docker run --rm node:22-bookworm-slim node --version