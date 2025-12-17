class ApiResponse {
  static success(res, data, message = 'Успішно', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, data, message = 'Створено успішно') {
    return this.success(res, data, message, 201);
  }

  static error(res, message = 'Помилка', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static notFound(res, message = 'Не знайдено') {
    return this.error(res, message, 404);
  }

  static badRequest(res, message = 'Невірний запит', errors = null) {
    return this.error(res, message, 400, errors);
  }

  static paginated(res, data, pagination, message = 'Успішно') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    });
  }
}

module.exports = ApiResponse;