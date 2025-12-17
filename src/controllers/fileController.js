const prisma = require('../config/database');
const ApiResponse = require('../utils/apiResponse');
const fs = require('fs').promises;
const path = require('path');

const fileController = {
  // Завантаження файлу
  async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.badRequest(res, 'Файл не надано');
      }

      const file = await prisma.file.create({
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          uploadedBy: req.user.userId
        }
      });

      return ApiResponse.created(res, {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/${req.file.filename}`
      }, 'Файл успішно завантажено');

    } catch (error) {
      // Видалити файл якщо помилка
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      next(error);
    }
  },

  // Завантаження аватара
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.badRequest(res, 'Файл не надано');
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Отримати старий аватар
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId }
      });

      // Видалити старий файл аватара
      if (user.avatar) {
        const oldPath = path.join(process.cwd(), user.avatar.replace(/^\//, ''));
        await fs.unlink(oldPath).catch(() => {});
      }

      // Оновити користувача
      const updatedUser = await prisma.user.update({
        where: { id: req.user.userId },
        data: { avatar: avatarUrl },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      });

      return ApiResponse.success(res, updatedUser, 'Аватар оновлено');
    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      next(error);
    }
  },

  // Отримати всі файли користувача
  async getMyFiles(req, res, next) {
    try {
      const files = await prisma.file.findMany({
        where: { uploadedBy: req.user.userId },
        orderBy: { createdAt: 'desc' }
      });

      return ApiResponse.success(res, files);
    } catch (error) {
      next(error);
    }
  },

  // Отримати файл
  async getFile(req, res, next) {
    try {
      const { id } = req.params;

      const file = await prisma.file.findUnique({
        where: { id: parseInt(id) }
      });

      if (!file) {
        return ApiResponse.notFound(res, 'Файл не знайдено');
      }

      res.sendFile(path.resolve(file.path));
    } catch (error) {
      next(error);
    }
  },

  // Видалити файл
  async deleteFile(req, res, next) {
    try {
      const { id } = req.params;

      const file = await prisma.file.findUnique({
        where: { id: parseInt(id) }
      });

      if (!file) {
        return ApiResponse.notFound(res, 'Файл не знайдено');
      }

      // Перевірка прав
      if (file.uploadedBy !== req.user.userId && req.user.role !== 'ADMIN') {
        return ApiResponse.forbidden(res, 'Ви не маєте прав для видалення цього файлу');
      }

      // Видалити файл з диску
      await fs.unlink(file.path).catch(() => {});

      // Видалити запис з БД
      await prisma.file.delete({
        where: { id: parseInt(id) }
      });

      return ApiResponse.success(res, null, 'Файл успішно видалено');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = fileController;