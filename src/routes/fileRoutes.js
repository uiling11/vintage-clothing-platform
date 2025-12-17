const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticate } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Завантаження файлу
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Файл завантажено
 *       400:
 *         description: Помилка завантаження
 */
router.post('/upload', authenticate, upload.single('file'), handleMulterError, fileController.uploadFile);

/**
 * @swagger
 * /api/files/avatar:
 *   post:
 *     summary: Завантаження аватара
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Аватар оновлено
 */
router.post('/avatar', authenticate, upload.single('avatar'), handleMulterError, fileController.uploadAvatar);

/**
 * @swagger
 * /api/files/my:
 *   get:
 *     summary: Мої файли
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список файлів
 */
router.get('/my', authenticate, fileController.getMyFiles);

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     summary: Отримати файл
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Файл
 *       404:
 *         description: Не знайдено
 */
router.get('/:id', fileController.getFile);

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     summary: Видалити файл
 *     tags: [Files]
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
 *         description: Файл видалено
 */
router.delete('/:id', authenticate, fileController.deleteFile);

module.exports = router;