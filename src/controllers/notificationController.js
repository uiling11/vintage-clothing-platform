const prisma = require('../config/database');
const ApiResponse = require('../utils/apiResponse');
const { getPagination, getPaginationMeta } = require('../utils/helpers');

const notificationController = {
  // Отримати всі сповіщення користувача
  async getAll(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20, unreadOnly } = req.query;
      const { skip, take } = getPagination(page, limit);

      const where = { userId };
      if (unreadOnly === 'true') {
        where.isRead = false;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.notification.count({ where })
      ]);

      const pagination = getPaginationMeta(total, page, take);
      return ApiResponse.paginated(res, notifications, pagination);
    } catch (error) {
      next(error);
    }
  },

  // Отримати кількість непрочитаних
  async getUnreadCount(req, res, next) {
    try {
      const count = await prisma.notification.count({
        where: { userId: req.user.userId, isRead: false }
      });

      return ApiResponse.success(res, { count });
    } catch (error) {
      next(error);
    }
  },

  // Позначити як прочитане
  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;

      const notification = await prisma.notification.update({
        where: { 
          id: parseInt(id),
          userId: req.user.userId 
        },
        data: { isRead: true }
      });

      return ApiResponse.success(res, notification);
    } catch (error) {
      next(error);
    }
  },

  // Позначити всі як прочитані
  async markAllAsRead(req, res, next) {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user.userId, isRead: false },
        data: { isRead: true }
      });

      return ApiResponse.success(res, null, 'Всі сповіщення прочитано');
    } catch (error) {
      next(error);
    }
  },

  // Видалити сповіщення
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await prisma.notification.delete({
        where: { 
          id: parseInt(id),
          userId: req.user.userId 
        }
      });

      return ApiResponse.success(res, null, 'Сповіщення видалено');
    } catch (error) {
      next(error);
    }
  },

  // Видалити всі прочитані
  async deleteAllRead(req, res, next) {
    try {
      await prisma.notification.deleteMany({
        where: { userId: req.user.userId, isRead: true }
      });

      return ApiResponse.success(res, null, 'Прочитані сповіщення видалено');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = notificationController;