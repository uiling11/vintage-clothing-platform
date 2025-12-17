const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const validate = require('../middleware/validate');
const { body, param } = require('express-validator');

const reviewValidation = [
  body('productId').isInt({ min: 1 }),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Рейтинг від 1 до 5')
];

const idValidation = [param('id').isInt({ min: 1 })];

router.get('/product/:productId', reviewController.getByProduct);
router.post('/', validate(reviewValidation), reviewController.create);
router.put('/:id', validate(idValidation), reviewController.update);
router.delete('/:id', validate(idValidation), reviewController.delete);

module.exports = router;