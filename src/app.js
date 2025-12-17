require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const prisma = require('./config/database');
const { initializeSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

// Ініціалізація Socket.io
initializeSocket(server);

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Забагато запитів, спробуйте пізніше'
  }
});

app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Vintage Clothing API Docs'
}));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.io test page
app.get('/socket-test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Socket.io Test</title>
      <script src="/socket.io/socket.io.js"></script>
      <style>
        body { font-family: Arial; padding: 20px; }
        #log { background: #f5f5f5; padding: 10px; height: 300px; overflow-y: auto; }
        button { margin: 5px; padding: 10px 20px; }
      </style>
    </head>
    <body>
      <h1>🔌 Socket.io Test</h1>
      <div>
        <input type="text" id="token" placeholder="JWT Token (optional)" style="width: 300px; padding: 5px;">
        <button onclick="connect()">Connect</button>
        <button onclick="disconnect()">Disconnect</button>
      </div>
      <div id="log"></div>
      <script>
        let socket;
        function log(msg) {
          document.getElementById('log').innerHTML += new Date().toLocaleTimeString() + ': ' + msg + '<br>';
        }
        function connect() {
          const token = document.getElementById('token').value;
          socket = io({ auth: { token } });
          socket.on('connect', () => log('✅ Connected: ' + socket.id));
          socket.on('disconnect', () => log('❌ Disconnected'));
          socket.on('notification:new', (n) => log('🔔 Notification: ' + n.title));
          socket.on('notifications:unread', (n) => log('📬 Unread: ' + n.length));
          socket.on('user:online', (u) => log('👤 Online: User ' + u.userId));
          socket.on('user:offline', (u) => log('👤 Offline: User ' + u.userId));
          socket.on('product:updated', (p) => log('📦 Product updated: ' + p.title));
          socket.on('product:new', (p) => log('🆕 New product: ' + p.title));
        }
        function disconnect() {
          if (socket) socket.disconnect();
        }
      </script>
    </body>
    </html>
  `);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Маршрут ${req.originalUrl} не знайдено`
  });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Підключено до бази даних');

    server.listen(PORT, () => {
      console.log(`🚀 Сервер: http://localhost:${PORT}`);
      console.log(`📚 API: http://localhost:${PORT}/api`);
      console.log(`📖 Swagger: http://localhost:${PORT}/api-docs`);
      console.log(`🔌 Socket.io: ws://localhost:${PORT}`);
      console.log(`🧪 Socket Test: http://localhost:${PORT}/socket-test`);
    });
  } catch (error) {
    console.error('❌ Помилка:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

module.exports = { app, server };