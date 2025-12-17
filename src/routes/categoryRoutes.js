const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const { body, param } = require('express-validator');

const categoryValidation = [
  body('name').trim().notEmpty().withMessage('Назва обов\'язкова')
];

const idValidation = [param('id').isInt({ min: 1 }).withMessage('Невірний ID')];

router.get('/', categoryController.getAll);
router.get('/:id', validate(idValidation), categoryController.getById);
router.post('/', validate(categoryValidation), categoryController.create);
router.put('/:id', validate(idValidation), categoryController.update);
router.delete('/:id', validate(idValidation), categoryController.delete);

module.exports = router;