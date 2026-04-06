import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { logger } from '@handy-go/shared';
import { config } from './config/index.js';
import { serviceRoutes } from './config/routes.js';
import { authenticate } from './middleware/auth.js';
import {
  generalRateLimiter,
  authRateLimiter,
  authenticatedRateLimiter,
  sosRateLimiter
} from './middleware/rateLimiter.js';
import {
  requestId,
  requestLogger,
  securityHeaders,
  handlePreflight,
} from './middleware/common.js';
import { setupProxies } from './middleware/proxy.js';

const app: Application = express();

// ==================== Global Middleware ====================

// Trust proxy (for rate limiting and IP detection behind reverse proxy)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false,
}));
app.use(securityHeaders);

// CORS
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
app.use(handlePreflight);

// Compression
app.use(compression());

// Request ID and logging
app.use(requestId);
app.use(requestLogger);

// HTTP request logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    services: Object.entries(config.services).map(([name, url]) => ({
      name,
      url,
    })),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

// ==================== Rate Limiting ====================

// Apply rate limiting based on route
app.use('/api/auth', authRateLimiter);
app.use('/api/sos', sosRateLimiter);

// ==================== Authentication ====================

// Authenticate requests (skips public routes)
app.use(authenticate);

// Apply authenticated rate limiter after auth
app.use(authenticatedRateLimiter);

// ==================== Service Proxies ====================

// Set up proxies to microservices
setupProxies(app);

// ==================== 404 Handler ====================

app.use((req, res) => {
  if (res.headersSent) return;
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// ==================== Error Handler ====================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Guard: proxy onError may have already sent a response
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message: config.nodeEnv === 'production'
      ? 'Internal server error'
      : err.message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// ==================== Server Start ====================

const startServer = () => {
  const server = app.listen(config.port, () => {
    logger.info(`🚀 API Gateway running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info('Configured services:');
    Object.entries(config.services).forEach(([name, url]) => {
      logger.info(`  - ${name}: ${url}`);
    });
    logger.info('Server is now listening for connections...');
  });

  server.on('error', (error: Error) => {
    logger.error('Server error:', error);
    process.exit(1);
  });

  server.on('close', () => {
    logger.info('Server closed');
  });

  server.on('listening', () => {
    logger.info('Server is listening!');
  });

  // Keep the process alive
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  return server;
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  logger.error('Uncaught Exception:', error);
  // Node.js docs: state is undefined after uncaughtException — always exit.
  // In production, a process manager (PM2/k8s) will restart the process.
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;
