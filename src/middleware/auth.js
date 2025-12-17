const { ApiError } = require('../utils/ApiError');

// Заглушка для аутентифікації (буде реалізовано в лабораторній 2)
const authenticate = (req, res, next) => {
  // Тимчасово: імітуємо авторизованого користувача
  req.user = {
    id: 'temp-user-id',
    role: 'SELLER'
  };
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Необхідна авторизація');
    }
    
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('Недостатньо прав для цієї дії');
    }
    
    next();
  };
};

module.exports = { authenticate, authorize };