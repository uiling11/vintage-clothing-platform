require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const prisma = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Маршрут ${req.originalUrl} не знайдено` });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Підключено до бази даних');
    
    app.listen(PORT, () => {
      console.log(`🚀 Сервер: http://localhost:${PORT}`);
      console.log(`📚 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Помилка:', error);
    process.exit(1);
  }
};

startServer();