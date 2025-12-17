const prisma = require('../config/database');
const ApiResponse = require('../utils/apiResponse');
const { generateUniqueSlug, getPagination, getPaginationMeta } = require('../utils/helpers');

const productController = {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 12, categoryId, minPrice, maxPrice, condition, size, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      const { skip, take } = getPagination(page, limit);

      const where = { status: 'ACTIVE' };
      if (categoryId) where.categoryId = parseInt(categoryId);
      if (condition) where.condition = condition;
      if (size) where.size = size;
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice);
        if (maxPrice) where.price.lte = parseFloat(maxPrice);
      }
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where, skip, take,
          orderBy: { [sortBy]: sortOrder },
          include: {
            category: { select: { id: true, name: true, slug: true } },
            seller: { select: { id: true, firstName: true, lastName: true } },
            images: { where: { isPrimary: true }, take: 1 },
            _count: { select: { reviews: true, favorites: true } }
          }
        }),
        prisma.product.count({ where })
      ]);

      const pagination = getPaginationMeta(total, page, take);
      return ApiResponse.paginated(res, products, pagination, 'Товари отримано');
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: {
          category: true,
          seller: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          reviews: {
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          _count: { select: { reviews: true, favorites: true } }
        }
      });

      if (!product) {
        return ApiResponse.notFound(res, 'Товар не знайдено');
      }

      await prisma.product.update({
        where: { id: parseInt(id) },
        data: { views: { increment: 1 } }
      });

      return ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { title, description, price, originalPrice, brand, size, color, material, condition, era, style, categoryId, quantity, images } = req.body;
      const sellerId = req.user?.id || 1;
      const slug = generateUniqueSlug(title);

      const product = await prisma.product.create({
        data: {
          title, slug, description,
          price: parseFloat(price),
          originalPrice: originalPrice ? parseFloat(originalPrice) : null,
          brand, size, color, material,
          condition: condition || 'GOOD',
          era, style,
          quantity: quantity || 1,
          sellerId,
          categoryId: parseInt(categoryId),
          images: images?.length ? {
            create: images.map((img, index) => ({
              url: img.url,
              altText: img.altText || title,
              isPrimary: index === 0,
              sortOrder: index
            }))
          } : undefined
        },
        include: { category: true, images: true }
      });

      return ApiResponse.created(res, product, 'Товар створено');
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      delete updateData.sellerId;
      delete updateData.images;
      delete updateData.slug;

      if (updateData.price) updateData.price = parseFloat(updateData.price);
      if (updateData.originalPrice) updateData.originalPrice = parseFloat(updateData.originalPrice);
      if (updateData.categoryId) updateData.categoryId = parseInt(updateData.categoryId);

      const product = await prisma.product.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: { category: true, images: true }
      });

      return ApiResponse.success(res, product, 'Товар оновлено');
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.product.delete({ where: { id: parseInt(id) } });
      return ApiResponse.success(res, null, 'Товар видалено');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = productController;