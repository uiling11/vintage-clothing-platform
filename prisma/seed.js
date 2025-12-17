const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Заповнення бази даних...');

  // Очищення
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.file.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Адмін
  const admin = await prisma.user.create({
    data: {
      email: 'admin@vintage.com',
      password: hashedPassword,
      firstName: 'Адмін',
      lastName: 'Системи',
      role: 'ADMIN',
      phone: '+380991111111'
    }
  });

  // Продавець
  const seller = await prisma.user.create({
    data: {
      email: 'seller@vintage.com',
      password: hashedPassword,
      firstName: 'Олена',
      lastName: 'Продавець',
      role: 'SELLER',
      phone: '+380992222222',
      addresses: {
        create: {
          city: 'Київ',
          street: 'вул. Хрещатик',
          building: '1',
          postalCode: '01001',
          isDefault: true
        }
      }
    }
  });

  // Покупець
  const buyer = await prisma.user.create({
    data: {
      email: 'buyer@vintage.com',
      password: hashedPassword,
      firstName: 'Іван',
      lastName: 'Покупець',
      role: 'USER',
      phone: '+380993333333',
      addresses: {
        create: {
          city: 'Львів',
          street: 'пл. Ринок',
          building: '5',
          postalCode: '79000',
          isDefault: true
        }
      }
    }
  });

  // Категорії
  const women = await prisma.category.create({
    data: { name: 'Жіночий одяг', slug: 'women', description: 'Вінтажний жіночий одяг' }
  });

  const men = await prisma.category.create({
    data: { name: 'Чоловічий одяг', slug: 'men', description: 'Вінтажний чоловічий одяг' }
  });

  const accessories = await prisma.category.create({
    data: { name: 'Аксесуари', slug: 'accessories', description: 'Вінтажні аксесуари' }
  });

  const dresses = await prisma.category.create({
    data: { name: 'Сукні', slug: 'dresses', parentId: women.id }
  });

  const jackets = await prisma.category.create({
    data: { name: 'Куртки', slug: 'jackets', parentId: men.id }
  });

  // Товари
  const product1 = await prisma.product.create({
    data: {
      title: 'Вінтажна шовкова сукня 70-х',
      slug: 'vintage-silk-dress-70s',
      description: 'Розкішна шовкова сукня в стилі 70-х років з квітковим принтом.',
      price: 2500.00,
      originalPrice: 3500.00,
      brand: 'Christian Dior',
      size: 'M',
      color: 'Бежевий',
      material: 'Шовк',
      condition: 'EXCELLENT',
      era: '70s',
      style: 'Bohemian',
      sellerId: seller.id,
      categoryId: dresses.id,
      images: { create: [{ url: '/uploads/products/dress-1.jpg', isPrimary: true }] }
    }
  });

  const product2 = await prisma.product.create({
    data: {
      title: 'Джинсова куртка Levis 80-х',
      slug: 'levis-denim-jacket-80s',
      description: 'Класична джинсова куртка з 80-х років. Оригінал, зроблено в США.',
      price: 1800.00,
      brand: 'Levis',
      size: 'L',
      color: 'Синій',
      material: 'Денім',
      condition: 'GOOD',
      era: '80s',
      style: 'Casual',
      sellerId: seller.id,
      categoryId: jackets.id,
      images: { create: [{ url: '/uploads/products/jacket-1.jpg', isPrimary: true }] }
    }
  });

  const product3 = await prisma.product.create({
    data: {
      title: 'Шкіряна сумка 60-х років',
      slug: 'leather-bag-60s',
      description: 'Елегантна шкіряна сумка ручної роботи з 60-х років.',
      price: 1500.00,
      brand: 'Handmade',
      size: 'One size',
      color: 'Коричневий',
      material: 'Натуральна шкіра',
      condition: 'GOOD',
      era: '60s',
      sellerId: seller.id,
      categoryId: accessories.id,
      images: { create: [{ url: '/uploads/products/bag-1.jpg', isPrimary: true }] }
    }
  });

  // Відгук
  await prisma.review.create({
    data: {
      userId: buyer.id,
      productId: product1.id,
      rating: 5,
      comment: 'Чудова сукня! Якість неймовірна!'
    }
  });

  // Улюблене
  await prisma.favorite.create({
    data: { userId: buyer.id, productId: product2.id }
  });

  console.log('✅ База даних заповнена!');
  console.log('\n📋 Тестові акаунти:');
  console.log('   👑 Admin: admin@vintage.com / password123');
  console.log('   🏪 Seller: seller@vintage.com / password123');
  console.log('   👤 Buyer: buyer@vintage.com / password123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());