const ApiResponse = require('../utils/apiResponse');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Необхідна аутентифікація');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, 'Недостатньо прав для виконання цієї операції');
    }

    next();
  };
};

const isOwnerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res, 'Необхідна аутентифікація');
      }

      if (req.user.role === 'ADMIN') {
        return next();
      }

      const resourceUserId = await getResourceUserId(req);
      
      if (resourceUserId !== req.user.userId) {
        return ApiResponse.forbidden(res, 'Ви можете редагувати тільки власні ресурси');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { authorize, isOwnerOrAdmin };