const prisma = require('../config/database');
const ApiResponse = require('../utils/apiResponse');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

const authController = {
  // Реєстрація
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      // Валідація
      if (!email || !password || !firstName || !lastName) {
        return ApiResponse.badRequest(res, 'Email, пароль, ім\'я та прізвище обов\'язкові');
      }

      if (password.length < 6) {
        return ApiResponse.badRequest(res, 'Пароль має містити мінімум 6 символів');
      }

      // Перевірка чи існує користувач
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return ApiResponse.badRequest(res, 'Користувач з таким email вже існує', 409);
      }

      // Хешування пароля
      const hashedPassword = await hashPassword(password);

      // Створення користувача
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true
        }
      });

      // Генерація токенів
      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // Збереження refresh токену
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
      });

      return ApiResponse.created(res, {
        user,
        tokens: { accessToken, refreshToken }
      }, 'Реєстрація успішна');

    } catch (error) {
      next(error);
    }
  },

  // Вхід
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return ApiResponse.badRequest(res, 'Email та пароль обов\'язкові');
      }

      // Пошук користувача
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return ApiResponse.unauthorized(res, 'Невірний email або пароль');
      }

      if (!user.isActive) {
        return ApiResponse.forbidden(res, 'Акаунт деактивовано');
      }

      // Перевірка пароля
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        return ApiResponse.unauthorized(res, 'Невірний email або пароль');
      }

      // Генерація токенів
      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // Збереження refresh токену
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
      });

      const { password: _, refreshToken: __, ...userWithoutSensitive } = user;

      return ApiResponse.success(res, {
        user: userWithoutSensitive,
        tokens: { accessToken, refreshToken }
      }, 'Вхід успішний');

    } catch (error) {
      next(error);
    }
  },

  // Оновлення токену
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ApiResponse.badRequest(res, 'Refresh токен відсутній');
      }

      // Верифікація токену
      const decoded = verifyRefreshToken(refreshToken);

      // Пошук користувача
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || user.refreshToken !== refreshToken) {
        return ApiResponse.unauthorized(res, 'Недійсний refresh токен');
      }

      // Генерація нових токенів
      const newAccessToken = generateAccessToken(user.id, user.role);
      const newRefreshToken = generateRefreshToken(user.id);

      // Оновлення refresh токену в БД
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken }
      });

      return ApiResponse.success(res, {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      }, 'Токени оновлено');

    } catch (error) {
      return ApiResponse.unauthorized(res, 'Недійсний refresh токен');
    }
  },

  // Вихід
  async logout(req, res, next) {
    try {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { refreshToken: null }
      });

      return ApiResponse.success(res, null, 'Вихід успішний');
    } catch (error) {
      next(error);
    }
  },

  // Отримати поточного користувача
  async getMe(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { products: true, orders: true, reviews: true, favorites: true }
          }
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

  // Зміна пароля
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return ApiResponse.badRequest(res, 'Поточний та новий пароль обов\'язкові');
      }

      if (newPassword.length < 6) {
        return ApiResponse.badRequest(res, 'Новий пароль має містити мінімум 6 символів');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId }
      });

      const isPasswordValid = await comparePassword(currentPassword, user.password);

      if (!isPasswordValid) {
        return ApiResponse.badRequest(res, 'Невірний поточний пароль');
      }

      const hashedPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: req.user.userId },
        data: { password: hashedPassword, refreshToken: null }
      });

      return ApiResponse.success(res, null, 'Пароль успішно змінено');
    } catch (error) {
      next(error);
    }
  },

  // Оновлення профілю
  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          firstName,
          lastName,
          phone
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          role: true
        }
      });

      return ApiResponse.success(res, user, 'Профіль оновлено');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;