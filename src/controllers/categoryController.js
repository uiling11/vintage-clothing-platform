const prisma = require('../config/database');
const ApiResponse = require('../utils/apiResponse');
const { generateSlug } = require('../utils/helpers');

const categoryController = {
  async getAll(req, res, next) {
    try {
      const categories = await prisma.category.findMany({
        include: {
          children: true,
          _count: { select: { products: true } }
        },
        where: { parentId: null },
        orderBy: { name: 'asc' }
      });
      return ApiResponse.success(res, categories, 'Категорії отримано');
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await prisma.category.findUnique({
        where: { id: parseInt(id) },
        include: {
          parent: true,
          children: true,
          products: { where: { status: 'ACTIVE' }, take: 10 }
        }
      });

      if (!category) {
        return ApiResponse.notFound(res, 'Категорію не знайдено');
      }
      return ApiResponse.success(res, category);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, description, parentId, image } = req.body;
      const slug = generateSlug(name);

      const category = await prisma.category.create({
        data: {
          name,
          slug,
          description,
          image,
          parentId: parentId ? parseInt(parentId) : null
        }
      });
      return ApiResponse.created(res, category, 'Категорію створено');
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, parentId, image } = req.body;

      const updateData = {};
      if (name) {
        updateData.name = name;
        updateData.slug = generateSlug(name);
      }
      if (description !== undefined) updateData.description = description;
      if (image !== undefined) updateData.image = image;
      if (parentId !== undefined) updateData.parentId = parentId ? parseInt(parentId) : null;

      const category = await prisma.category.update({
        where: { id: parseInt(id) },
        data: updateData
      });
      return ApiResponse.success(res, category, 'Категорію оновлено');
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.category.delete({ where: { id: parseInt(id) } });
      return ApiResponse.success(res, null, 'Категорію видалено');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = categoryController;