import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { logger, errorHandler } from '@handy-go/shared';
import { config } from './config/index.js';
import sosRoutes from './routes/sos.routes.js';
import { startAllJobs } from './jobs/sos.jobs.js';
const app = express();
// Security middleware
app.use(helmet());
app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
}));
// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'sos-service',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
});
// Routes
app.use('/api/sos', sosRoutes);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});
// Global error handler
app.use(errorHandler);
// Database connection and server start
const startServer = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongoUri);
        logger.info('Connected to MongoDB');
        // Start background jobs
        startAllJobs();
        // Start server
        app.listen(config.port, () => {
            logger.info(`SOS service running on port ${config.port}`);
            logger.info(`Environment: ${config.nodeEnv}`);
        });
    }
    catch (error) {
        logger.error('Failed to start SOS service:', error);
        process.exit(1);
    }
};
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});
startServer();
export default app;
//# sourceMappingURL=index.js.map