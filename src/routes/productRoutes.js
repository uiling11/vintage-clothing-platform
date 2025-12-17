const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const validate = require('../middleware/validate');
const { body, param } = require('express-validator');

const productValidation = [
  body('title').trim().notEmpty().withMessage('Назва обов\'язкова'),
  body('description').trim().notEmpty().withMessage('Опис обов\'язковий'),
  body('price').notEmpty().isFloat({ min: 0.01 }).withMessage('Ціна обов\'язкова'),
  body('size').trim().notEmpty().withMessage('Розмір обов\'язковий'),
  body('color').trim().notEmpty().withMessage('Колір обов\'язковий'),
  body('categoryId').notEmpty().isInt({ min: 1 }).withMessage('Категорія обов\'язкова')
];

const idValidation = [param('id').isInt({ min: 1 }).withMessage('Невірний ID')];

router.get('/', productController.getAll);
router.get('/:id', validate(idValidation), productController.getById);
router.post('/', validate(productValidation), productController.create);
router.put('/:id', validate(idValidation), productController.update);
router.delete('/:id', validate(idValidation), productController.delete);

module.exports = router;