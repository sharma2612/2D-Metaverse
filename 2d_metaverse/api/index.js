import express from 'express';
import connectDB from './db/connect.db.js';
import dotenv from 'dotenv';
import { AuthRouter } from './routes/auth.route.js';
import { MessageRoute } from './routes/message.route.js';
import errorHandler from './middlewares/errorHandler.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { app,server } from './socket.js';
import router from './token.js';
import path from 'path'
const __dirname = path.resolve();
dotenv.config();
// Render/Fly terminate TLS and forward plain HTTP, so without this Express
// reports req.secure === false and refuses to set the "secure" auth cookie.
app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
const allowedOrigins = (process.env.CLIENT_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    // A literal "*" is rejected by browsers when credentials are used, so echo
    // the caller's origin back instead. Only that matters when a specific
    // allowlist is configured via CLIENT_ORIGIN.
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use("/api/v1/auth", AuthRouter);
app.use("/api/v1/message", MessageRoute);
app.use("/api/v1/live",router)

// Vite emits content-hashed filenames under /assets, so those are safe to cache
// indefinitely. index.html must not be cached, or clients keep loading a stale
// bundle reference after a deploy.
app.use(
  express.static(path.join(__dirname, '..', 'dist'), {
    index: false,
    maxAge: '1y',
    immutable: true,
    setHeaders(res, filePath) {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  })
);

// SPA fallback: the client uses react-router in BrowserRouter mode, so deep
// links like /map or /room2/123 are served by the app, not the static folder.
// Registered last among the routes so real files and /api paths still win.
app.get(/.*/, (req, res, next) => {
  const pathname = req.path;
  if (pathname.startsWith('/api/') || pathname.startsWith('/socket.io/')) return next();
  // A request that looks like a file (has an extension) is a genuinely missing
  // asset, so let it 404 rather than silently returning HTML that the browser
  // would try to execute as JavaScript.
  if (path.extname(pathname)) return next();
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'), (err) => {
    if (err) next(err);
  });
});

app.use(errorHandler);


connectDB()
  .then(() => {
    console.log('Database connected successfully');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error(`Database connection error: ${error.message}`);
  });