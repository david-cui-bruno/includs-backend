// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { documentsRouter } from './controllers/documents';

dotenv.config();

console.log('🚀 Starting incluDS Backend API Server');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔑 OpenAI API Key:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('🌐 Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:5173');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('⚙️ Configuring Express app...');

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, {
    headers: req.headers,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    timestamp: new Date().toISOString()
  });
  next();
});

// Security middleware
console.log('🔒 Setting up security middleware...');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "'unsafe-inline'", "data:", "https:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false
}));

console.log('🌍 Setting up CORS...');
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
console.log('⏱️ Setting up rate limiting...');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: 'Too many requests, please try again later'
});
app.use('/api', limiter);

// Body parsing
console.log('📦 Setting up body parsing...');
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
console.log('🛣️ Setting up routes...');

// Root route
app.get('/', (req, res) => {
  console.log('📋 Root route accessed');
  res.json({ 
    message: 'incluDS Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api/documents',
      textSummarize: '/api/documents/text-summarize',
      documentSummarize: '/api/documents/document-summarize'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  console.log('❤️ Health check accessed');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Handle favicon requests
app.get('/favicon.ico', (req, res) => {
  console.log('🖼️ Favicon requested');
  res.status(204).end();
});

// API routes
console.log('📝 Setting up documents API routes...');
app.use('/api/documents', documentsRouter);

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /favicon.ico',
      'POST /api/documents/text-summarize',
      'POST /api/documents/document-summarize'
    ]
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 Error occurred:', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Express app configuration complete');

// For Vercel deployment
export default app;

// For local development
if (require.main === module) {
  console.log(`🚀 Starting server on port ${PORT}...`);
  app.listen(PORT, () => {
    console.log(`🎉 Backend server running successfully on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API base: http://localhost:${PORT}/api/documents`);
  });
}
