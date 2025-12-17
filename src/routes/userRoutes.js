const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const { body, param } = require('express-validator');

const createUserValidation = [
  body('email').trim().isEmail().withMessage('Невірний email'),
  body('password').isLength({ min: 6 }).withMessage('Пароль мінімум 6 символів'),
  body('firstName').trim().notEmpty().withMessage('Ім\'я обов\'язкове'),
  body('lastName').trim().notEmpty().withMessage('Прізвище обов\'язкове')
];

const idValidation = [param('id').isInt({ min: 1 }).withMessage('Невірний ID')];

router.get('/', userController.getAll);
router.get('/:id', validate(idValidation), userController.getById);
router.post('/', validate(createUserValidation), userController.create);
router.put('/:id', validate(idValidation), userController.update);
router.delete('/:id', validate(idValidation), userController.delete);

module.exports = router;