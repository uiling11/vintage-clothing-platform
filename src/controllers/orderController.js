const prisma = require('../config/database');
const ApiResponse = require('../utils/apiResponse');
const { generateOrderNumber, getPagination, getPaginationMeta } = require('../utils/helpers');

const orderController = {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 10, status, userId } = req.query;
      const { skip, take } = getPagination(page, limit);

      const where = {};
      if (status) where.status = status;
      if (userId) where.userId = parseInt(userId);

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where, skip, take,
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            address: true,
            items: { include: { product: { select: { id: true, title: true } } } },
            _count: { select: { items: true } }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.order.count({ where })
      ]);

      const pagination = getPaginationMeta(total, page, take);
      return ApiResponse.paginated(res, orders, pagination, 'Замовлення отримано');
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await prisma.order.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          address: true,
          items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } }
        }
      });

      if (!order) {
        return ApiResponse.notFound(res, 'Замовлення не знайдено');
      }
      return ApiResponse.success(res, order);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { userId, addressId, items, paymentMethod, notes, shippingCost = 0 } = req.body;

      const productIds = items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, status: 'ACTIVE' }
      });

      if (products.length !== items.length) {
        return ApiResponse.badRequest(res, 'Деякі товари недоступні');
      }

      let totalAmount = 0;
      const orderItems = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        const price = parseFloat(product.price);
        totalAmount += price * item.quantity;
        return { productId: item.productId, quantity: item.quantity, price };
      });
      totalAmount += parseFloat(shippingCost);

      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: parseInt(userId),
          addressId: parseInt(addressId),
          totalAmount, shippingCost: parseFloat(shippingCost),
          paymentMethod, notes,
          items: { create: orderItems }
        },
        include: { items: { include: { product: { select: { id: true, title: true } } } }, address: true }
      });

      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { status: 'SOLD' }
      });

      return ApiResponse.created(res, order, 'Замовлення створено');
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, paymentStatus } = req.body;

      const updateData = {};
      if (status) updateData.status = status;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;

      const order = await prisma.order.update({
        where: { id: parseInt(id) },
        data: updateData
      });

      return ApiResponse.success(res, order, 'Статус оновлено');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = orderController;