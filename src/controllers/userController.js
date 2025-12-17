const prisma = require('../config/database');
const ApiResponse = require('../utils/apiResponse');
const bcrypt = require('bcryptjs');
const { getPagination, getPaginationMeta } = require('../utils/helpers');

const userController = {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, role, search } = req.query;
      const { skip, take } = getPagination(page, limit);

      const where = {};
      if (role) where.role = role;
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where, skip, take,
          select: {
            id: true, email: true, firstName: true, lastName: true,
            phone: true, avatar: true, role: true, isActive: true, createdAt: true,
            _count: { select: { products: true, orders: true, reviews: true } }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      const pagination = getPaginationMeta(total, page, take);
      return ApiResponse.paginated(res, users, pagination, 'Користувачів отримано');
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          phone: true, avatar: true, role: true, isActive: true, createdAt: true,
          addresses: true,
          _count: { select: { products: true, orders: true, reviews: true } }
        }
      });

      if (!user) {
        return ApiResponse.notFound(res, 'Користувача не знайдено');
      }
      return ApiResponse.success(res, user);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone, role } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return ApiResponse.badRequest(res, 'Користувач з таким email вже існує');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: { email, password: hashedPassword, firstName, lastName, phone, role: role || 'USER' },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true }
      });

      return ApiResponse.created(res, user, 'Користувача створено');
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { firstName, lastName, phone, avatar, role, isActive } = req.body;

      const updateData = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (role) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;

      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true }
      });

      return ApiResponse.success(res, user, 'Користувача оновлено');
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.user.delete({ where: { id: parseInt(id) } });
      return ApiResponse.success(res, null, 'Користувача видалено');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;