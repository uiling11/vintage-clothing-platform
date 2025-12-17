const crypto = require('crypto');

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

const generateUniqueSlug = (text) => {
  const baseSlug = generateSlug(text);
  const uniqueId = crypto.randomBytes(4).toString('hex');
  return `${baseSlug}-${uniqueId}`;
};

const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

const getPagination = (page = 1, limit = 10) => {
  const take = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
  const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;
  return { skip, take };
};

const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = {
  generateSlug,
  generateUniqueSlug,
  generateOrderNumber,
  getPagination,
  getPaginationMeta,
};