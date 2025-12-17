const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const validate = require('../middleware/validate');
const { body, param } = require('express-validator');

const createOrderValidation = [
  body('userId').isInt({ min: 1 }),
  body('addressId').isInt({ min: 1 }),
  body('items').isArray({ min: 1 }).withMessage('Потрібен хоча б один товар')
];

const idValidation = [param('id').isInt({ min: 1 })];

router.get('/', orderController.getAll);
router.get('/:id', validate(idValidation), orderController.getById);
router.post('/', validate(createOrderValidation), orderController.create);
router.patch('/:id/status', validate(idValidation), orderController.updateStatus);

module.exports = router;