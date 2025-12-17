const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.code === 'P2002') {
    return ApiResponse.badRequest(res, 'Запис з такими даними вже існує');
  }

  if (err.code === 'P2025') {
    return ApiResponse.notFound(res, 'Запис не знайдено');
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Внутрішня помилка сервера';

  return ApiResponse.error(res, message, statusCode);
};

module.exports = errorHandler;