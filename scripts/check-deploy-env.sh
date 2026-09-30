#!/bin/sh
# Verifies deploy.env is both shell-sourceable (used by docker build) and
# readable by dotenv (used at runtime).
set -a
. ./deploy.env
set +a
echo "PORT=[$PORT]"
echo "NODE_ENV=[$NODE_ENV]"
echo "JWT_EXPIRY=[$JWT_EXPIRY]"
echo "MONGO_URL=[$MONGO_URL]"
echo "CLOUDINARY_API_SECRET=[$CLOUDINARY_API_SECRET]"
echo "CLIENT_ORIGIN=[$CLIENT_ORIGIN]"
echo "LIVEKIT_URL=[$LIVEKIT_URL]"
echo "VITE_LIVEKIT_URL=[$VITE_LIVEKIT_URL]"
echo "VITE_FIREBASE_KEY=[$VITE_FIREBASE_KEY]"
echo "VITE_TURN_URL=[$VITE_TURN_URL]"