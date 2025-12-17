const express = require('express');
const router = express.Router();

const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const userRoutes = require('./userRoutes');
const orderRoutes = require('./orderRoutes');
const reviewRoutes = require('./reviewRoutes');

router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);

router.get('/', (req, res) => {
  res.json({
    name: 'Vintage Clothing Platform API',
    version: '1.0.0',
    endpoints: {
      categories: '/api/categories',
      products: '/api/products',
      users: '/api/users',
      orders: '/api/orders',
      reviews: '/api/reviews'
    }
  });
});

module.exports = router;