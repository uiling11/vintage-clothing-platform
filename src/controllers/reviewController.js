const prisma = require('../config/database');
const ApiResponse = require('../utils/apiResponse');
const { getPagination, getPaginationMeta } = require('../utils/helpers');

const reviewController = {
  async getByProduct(req, res, next) {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const { skip, take } = getPagination(page, limit);

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { productId: parseInt(productId) },
          skip, take,
          include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.review.count({ where: { productId: parseInt(productId) } })
      ]);

      const avgRating = await prisma.review.aggregate({
        where: { productId: parseInt(productId) },
        _avg: { rating: true }
      });

      const pagination = getPaginationMeta(total, page, take);
      return ApiResponse.paginated(res, { reviews, averageRating: avgRating._avg.rating || 0 }, pagination);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { productId, rating, comment } = req.body;
      const userId = req.user?.id || 1;

      const review = await prisma.review.create({
        data: { userId, productId: parseInt(productId), rating: parseInt(rating), comment },
        include: { user: { select: { id: true, firstName: true, lastName: true } } }
      });

      return ApiResponse.created(res, review, 'Відгук додано');
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      const review = await prisma.review.update({
        where: { id: parseInt(id) },
        data: { rating: rating ? parseInt(rating) : undefined, comment }
      });

      return ApiResponse.success(res, review, 'Відгук оновлено');
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.review.delete({ where: { id: parseInt(id) } });
      return ApiResponse.success(res, null, 'Відгук видалено');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reviewController;