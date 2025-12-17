const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

let io;

// Зберігання онлайн користувачів
const onlineUsers = new Map();

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Middleware для аутентифікації
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        // Дозволяємо анонімне підключення для публічних подій
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, firstName: true, lastName: true, role: true }
      });

      if (!user) {
        return next(new Error('Користувача не знайдено'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Помилка аутентифікації'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket підключено: ${socket.id}`);

    // Якщо користувач авторизований
    if (socket.user) {
      const userId = socket.user.id;
      
      // Додаємо до онлайн користувачів
      onlineUsers.set(userId, {
        socketId: socket.id,
        user: socket.user,
        connectedAt: new Date()
      });

      // Приєднуємо до персональної кімнати
      socket.join(`user:${userId}`);
      
      // Приєднуємо до кімнати за роллю
      socket.join(`role:${socket.user.role}`);

      // Повідомляємо всіх про онлайн статус
      io.emit('user:online', {
        userId,
        user: {
          id: socket.user.id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        }
      });

      console.log(`👤 Користувач онлайн: ${socket.user.email}`);

      // Відправляємо непрочитані сповіщення
      sendUnreadNotifications(socket, userId);
    }

    // Підписка на оновлення товару
    socket.on('product:subscribe', (productId) => {
      socket.join(`product:${productId}`);
      console.log(`👁️ Socket ${socket.id} підписався на товар ${productId}`);
    });

    socket.on('product:unsubscribe', (productId) => {
      socket.leave(`product:${productId}`);
    });

    // Підписка на категорію
    socket.on('category:subscribe', (categoryId) => {
      socket.join(`category:${categoryId}`);
    });

    socket.on('category:unsubscribe', (categoryId) => {
      socket.leave(`category:${categoryId}`);
    });

    // Підписка на замовлення (для покупця)
    socket.on('order:subscribe', (orderId) => {
      if (socket.user) {
        socket.join(`order:${orderId}`);
      }
    });

    // Позначити сповіщення як прочитане
    socket.on('notification:read', async (notificationId) => {
      if (socket.user) {
        try {
          await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
          });
          socket.emit('notification:updated', { id: notificationId, isRead: true });
        } catch (error) {
          socket.emit('error', { message: 'Не вдалося оновити сповіщення' });
        }
      }
    });

    // Позначити всі сповіщення як прочитані
    socket.on('notification:readAll', async () => {
      if (socket.user) {
        try {
          await prisma.notification.updateMany({
            where: { userId: socket.user.id, isRead: false },
            data: { isRead: true }
          });
          socket.emit('notification:allRead');
        } catch (error) {
          socket.emit('error', { message: 'Не вдалося оновити сповіщення' });
        }
      }
    });

    // Отримати онлайн користувачів
    socket.on('users:getOnline', () => {
      const online = Array.from(onlineUsers.values()).map(u => ({
        userId: u.user.id,
        firstName: u.user.firstName,
        lastName: u.user.lastName,
        connectedAt: u.connectedAt
      }));
      socket.emit('users:online', online);
    });

    // Відключення
    socket.on('disconnect', (reason) => {
      console.log(`❌ Socket відключено: ${socket.id}, причина: ${reason}`);
      
      if (socket.user) {
        const userId = socket.user.id;
        onlineUsers.delete(userId);
        
        // Повідомляємо всіх про офлайн статус
        io.emit('user:offline', { userId });
        console.log(`👤 Користувач офлайн: ${socket.user.email}`);
      }
    });

    // Обробка помилок
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('✅ Socket.io ініціалізовано');
  return io;
};

// Відправка непрочитаних сповіщень
const sendUnreadNotifications = async (socket, userId) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    if (notifications.length > 0) {
      socket.emit('notifications:unread', notifications);
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};

// Отримати io instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io не ініціалізовано');
  }
  return io;
};

// Перевірка чи користувач онлайн
const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

// Отримати всіх онлайн користувачів
const getOnlineUsers = () => {
  return Array.from(onlineUsers.values());
};

module.exports = {
  initializeSocket,
  getIO,
  isUserOnline,
  getOnlineUsers
};