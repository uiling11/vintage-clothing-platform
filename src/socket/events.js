const { getIO } = require('./index');

const socketEvents = {
  // Оновлення товару
  productUpdated(product) {
    const io = getIO();
    io.to(`product:${product.id}`).emit('product:updated', product);
    io.to(`category:${product.categoryId}`).emit('category:productUpdated', {
      productId: product.id,
      title: product.title,
      price: product.price,
      status: product.status
    });
  },

  // Товар продано
  productSold(product) {
    const io = getIO();
    io.to(`product:${product.id}`).emit('product:sold', {
      productId: product.id,
      title: product.title
    });
    io.emit('products:sold', { productId: product.id });
  },

  // Новий товар
  productCreated(product) {
    const io = getIO();
    io.to(`category:${product.categoryId}`).emit('product:new', {
      id: product.id,
      title: product.title,
      price: product.price,
      slug: product.slug
    });
  },

  // Товар видалено
  productDeleted(productId, categoryId) {
    const io = getIO();
    io.to(`product:${productId}`).emit('product:deleted', { productId });
    io.to(`category:${categoryId}`).emit('category:productDeleted', { productId });
  },

  // Оновлення замовлення
  orderUpdated(order) {
    const io = getIO();
    io.to(`order:${order.id}`).emit('order:updated', order);
    io.to(`user:${order.userId}`).emit('user:orderUpdated', {
      orderId: order.id,
      status: order.status
    });
  },

  // Нове замовлення (для продавців)
  newOrder(order, sellerId) {
    const io = getIO();
    io.to(`user:${sellerId}`).emit('seller:newOrder', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount
    });
  },

  // Кількість онлайн користувачів
  emitOnlineCount() {
    const io = getIO();
    const count = io.engine.clientsCount;
    io.emit('stats:onlineCount', { count });
  }
};

module.exports = socketEvents;