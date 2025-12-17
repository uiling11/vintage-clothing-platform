const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const fileRoutes = require('./fileRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const userRoutes = require('./userRoutes');
const orderRoutes = require('./orderRoutes');
const reviewRoutes = require('./reviewRoutes');
const notificationRoutes = require('./notificationRoutes');

// Маршрути
router.use('/auth', authRoutes);
router.use('/files', fileRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);

// Інформація про API
router.get('/', (req, res) => {
  res.json({
    name: 'Vintage Clothing Platform API',
    version: '1.0.0',
    description: 'API для платформи продажу вінтажного одягу',
    documentation: '/api-docs',
    websocket: 'ws://localhost:3000',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      reviews: '/api/reviews',
      files: '/api/files',
      notifications: '/api/notifications'
    }
  });
});

module.exports = router;