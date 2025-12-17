const prisma = require('../config/database');
const { getIO, isUserOnline } = require('./index');

const notificationService = {
  // Створити та відправити сповіщення
  async send(userId, type, title, message, data = null, priority = 'NORMAL') {
    try {
      // Зберегти в БД
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data,
          priority
        }
      });

      // Відправити через WebSocket якщо користувач онлайн
      if (isUserOnline(userId)) {
        const io = getIO();
        io.to(`user:${userId}`).emit('notification:new', notification);
      }

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  // Сповіщення про зміну статусу замовлення
  async orderStatusChanged(order, newStatus) {
    const statusMessages = {
      CONFIRMED: 'Ваше замовлення підтверджено',
      PROCESSING: 'Ваше замовлення обробляється',
      SHIPPED: 'Ваше замовлення відправлено',
      DELIVERED: 'Ваше замовлення доставлено',
      CANCELLED: 'Ваше замовлення скасовано'
    };

    await this.send(
      order.userId,
      'ORDER_STATUS',
      'Оновлення замовлення',
      statusMessages[newStatus] || `Статус замовлення: ${newStatus}`,
      { orderId: order.id, orderNumber: order.orderNumber, status: newStatus },
      newStatus === 'CANCELLED' ? 'HIGH' : 'NORMAL'
    );

    // Real-time оновлення для підписаних на замовлення
    const io = getIO();
    io.to(`order:${order.id}`).emit('order:statusChanged', {
      orderId: order.id,
      status: newStatus
    });
  },

  // Сповіщення про новий товар в категорії
  async newProductInCategory(product) {
    const io = getIO();
    
    // Відправляємо всім підписаним на категорію
    io.to(`category:${product.categoryId}`).emit('product:new', {
      id: product.id,
      title: product.title,
      price: product.price,
      categoryId: product.categoryId
    });
  },

  // Сповіщення про зниження ціни
  async priceDropped(product, oldPrice, newPrice) {
    // Знайти всіх хто додав товар в улюблені
    const favorites = await prisma.favorite.findMany({
      where: { productId: product.id },
      select: { userId: true }
    });

    const discount = Math.round((1 - newPrice / oldPrice) * 100);

    for (const fav of favorites) {
      await this.send(
        fav.userId,
        'PRICE_DROP',
        'Знижка на товар!',
        `Ціна на "${product.title}" знизилась на ${discount}%`,
        { productId: product.id, oldPrice, newPrice, discount },
        'HIGH'
      );
    }

    // Real-time оновлення сторінки товару
    const io = getIO();
    io.to(`product:${product.id}`).emit('product:priceChanged', {
      productId: product.id,
      oldPrice,
      newPrice
    });
  },

  // Сповіщення про новий відгук
  async newReview(review, product) {
    // Сповіщення продавцю
    await this.send(
      product.sellerId,
      'NEW_REVIEW',
      'Новий відгук',
      `Отримано новий відгук на "${product.title}"`,
      { productId: product.id, reviewId: review.id, rating: review.rating }
    );

    // Real-time оновлення на сторінці товару
    const io = getIO();
    io.to(`product:${product.id}`).emit('review:new', {
      productId: product.id,
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      }
    });
  },

  // Сповіщення всім адмінам
  async notifyAdmins(title, message, data = null) {
    const io = getIO();
    io.to('role:ADMIN').emit('notification:admin', {
      title,
      message,
      data,
      timestamp: new Date()
    });
  },

  // Broadcast всім користувачам
  async broadcast(title, message, data = null) {
    const io = getIO();
    io.emit('notification:broadcast', {
      title,
      message,
      data,
      timestamp: new Date()
    });
  }
};

module.exports = notificationService;