const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Отримати сповіщення
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Номер сторінки
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Кількість на сторінці
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Тільки непрочитані
 *     responses:
 *       200:
 *         description: Список сповіщень
 */
router.get('/', authenticate, notificationController.getAll);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Кількість непрочитаних
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Кількість
 */
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

/**
 * @swagger
 * /api/notifications/read-all:
 *   post:
 *     summary: Позначити всі як прочитані
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Успішно
 */
router.post('/read-all', authenticate, notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/delete-read:
 *   delete:
 *     summary: Видалити прочитані
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Успішно
 */
router.delete('/delete-read', authenticate, notificationController.deleteAllRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   post:
 *     summary: Позначити як прочитане
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Успішно
 */
router.post('/:id/read', authenticate, notificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Видалити сповіщення
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Успішно
 */
router.delete('/:id', authenticate, notificationController.delete);

module.exports = router;