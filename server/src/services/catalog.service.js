import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { Medicine } from '../models/Medicine.js';
import { Advertisement } from '../models/Advertisement.js';
import { HealthTip } from '../models/HealthTip.js';
import { buildPagination } from '../utils/pagination.js';

function toId(value) {
  return value ? String(value._id ?? value.id ?? value) : null;
}

export function serializeCategory(doc) {
  if (!doc) return null;
  return {
    id: toId(doc._id ?? doc),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? '',
    image: doc.image ?? '',
    visual: doc.visual ?? 'capsule',
    tone: doc.tone ?? 'teal',
    isActive: doc.isActive !== false,
  };
}

export function serializeMedicine(doc) {
  if (!doc) return null;

  const category = doc.categoryDoc ?? doc.category ?? {};
  const seller = doc.sellerDoc ?? doc.seller ?? {};
  const basePrice = Number(doc.price ?? 0);
  const discountPercent = Number(doc.discountPercent ?? 0);
  const finalPrice = Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;
  const stock = Number(doc.stock ?? 0);

  return {
    id: toId(doc._id ?? doc),
    name: doc.name,
    genericName: doc.genericName ?? '',
    manufacturer: doc.manufacturer ?? '',
    description: doc.description ?? '',
    strength: doc.strength ?? '',
    form: doc.form ?? 'Tablet',
    image: doc.image ?? doc.images?.[0] ?? '',
    images: doc.images ?? [],
    category: serializeCategory(category),
    categoryName: category.name ?? '',
    seller: {
      id: toId(seller._id ?? seller),
      name: seller.displayName || seller.username || seller.name || 'Medico vendor',
    },
    vendor: seller.displayName || seller.username || seller.name || 'Medico vendor',
    // `price` is the trusted, server-computed payable amount.
    price: finalPrice,
    originalPrice: basePrice,
    discountPercent,
    stock,
    inStock: doc.status === 'active' && stock > 0,
    status: doc.status ?? 'active',
    isFeatured: Boolean(doc.isFeatured),
    prescriptionRequired: Boolean(doc.prescriptionRequired),
    rating: Number(doc.rating ?? 0),
    reviewCount: Number(doc.reviewCount ?? 0),
    badge: doc.isFeatured ? "Vendor's pick" : null,
    visual: category.visual ?? doc.visual ?? 'capsule',
    tone: category.tone ?? doc.tone ?? 'teal',
  };
}

export function serializeAdvertisement(doc) {
  if (!doc) return null;
  return {
    id: toId(doc._id ?? doc),
    title: doc.title,
    subtitle: doc.subtitle ?? '',
    image: doc.image ?? '',
    ctaText: doc.ctaText ?? 'Shop now',
    ctaLink: doc.ctaLink ?? '/shop',
    visual: doc.visual ?? 'capsule',
    tone: doc.tone ?? 'teal',
    medicine: doc.medicineDoc ? serializeMedicine(doc.medicineDoc) : null,
  };
}

export function serializeHealthTip(doc) {
  if (!doc) return null;
  return {
    id: toId(doc._id ?? doc),
    title: doc.title,
    slug: doc.slug ?? '',
    excerpt: doc.excerpt ?? '',
    content: doc.content ?? '',
    image: doc.image ?? '',
    category: doc.category ?? 'General',
    visual: doc.visual ?? 'heart',
    tone: doc.tone ?? 'emerald',
    readMinutes: doc.readMinutes ?? 3,
    publishedAt: doc.publishedAt ?? doc.createdAt ?? null,
  };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveCategoryFilter(category) {
  if (!category) return null;
  if (mongoose.Types.ObjectId.isValid(category)) {
    const byId = await Category.findOne({ _id: category, isActive: true }).lean();
    if (byId) return byId._id;
  }
  const bySlug = await Category.findOne({ slug: String(category).toLowerCase(), isActive: true }).lean();
  return bySlug?._id ?? null;
}

function buildMedicinePipeline({ search, categoryId, sort, minPrice, maxPrice, featured, discounted, advertised }) {
  const match = { status: 'active', stock: { $gt: 0 } };
  if (categoryId) match.category = categoryId;
  if (featured) match.isFeatured = true;
  if (advertised) match.isAdvertised = true;
  if (search) {
    const expression = new RegExp(escapeRegex(search), 'i');
    match.$or = [
      { name: expression },
      { genericName: expression },
      { manufacturer: expression },
    ];
  }

  const priceMatch = {};
  if (minPrice !== undefined) priceMatch.$gte = minPrice;
  if (maxPrice !== undefined) priceMatch.$lte = maxPrice;

  const pipeline = [
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryDoc',
      },
    },
    { $unwind: '$categoryDoc' },
    { $match: { ...match, 'categoryDoc.isActive': true } },
    {
      $addFields: {
        finalPrice: {
          $round: [
            { $multiply: ['$price', { $subtract: [1, { $divide: ['$discountPercent', 100] }] }] },
            2,
          ],
        },
      },
    },
  ];

  if (discounted) pipeline.push({ $match: { discountPercent: { $gt: 0 } } });
  if (Object.keys(priceMatch).length) pipeline.push({ $match: { finalPrice: priceMatch } });

  return pipeline;
}

const SORT_STAGES = {
  price: { finalPrice: 1 },
  '-price': { finalPrice: -1 },
  '-discountPercent': { discountPercent: -1, finalPrice: 1 },
  name: { name: 1 },
};

export async function listMedicines({
  search = '',
  category = '',
  sort = '',
  page = 1,
  limit = 10,
  minPrice,
  maxPrice,
  featured = false,
  discounted = false,
  advertised = false,
} = {}) {
  const categoryId = await resolveCategoryFilter(category);
  const pipeline = buildMedicinePipeline({
    search,
    categoryId,
    sort,
    minPrice,
    maxPrice,
    featured,
    discounted,
    advertised,
  });

  const [countResult] = await Medicine.aggregate([...pipeline, { $count: 'total' }]);
  const total = countResult?.total ?? 0;

  const rows = await Medicine.aggregate([
    ...pipeline,
    {
      $lookup: {
        from: 'users',
        localField: 'seller',
        foreignField: '_id',
        as: 'sellerDoc',
      },
    },
    { $unwind: { path: '$sellerDoc', preserveNullAndEmptyArrays: true } },
    { $sort: SORT_STAGES[sort] ?? { isFeatured: -1, createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);

  return {
    items: rows.map((row) => serializeMedicine({ ...row, image: row.images?.[0] ?? '' })),
    pagination: buildPagination({ page, limit, total }),
  };
}

export async function getMedicineById(id) {
  const doc = await Medicine.findOne({
    _id: id,
    status: 'active',
    stock: { $gt: 0 },
  })
    .populate({ path: 'category', match: { isActive: true } })
    .populate('seller', 'username displayName photoURL');

  if (!doc || !doc.category) return null;
  return serializeMedicine(doc);
}

export async function listCategories({ active = true, limit } = {}) {
  const filter = active ? { isActive: true } : {};
  let query = Category.find(filter).sort({ sortOrder: 1, name: 1 });
  if (limit) query = query.limit(limit);
  const docs = await query.lean();
  return docs.map(serializeCategory);
}

export async function getCategoryById(id) {
  const doc = await Category.findOne({ _id: id, isActive: true }).lean();
  return doc ? serializeCategory(doc) : null;
}

export async function getCategoryMedicines(id, options = {}) {
  const doc = await Category.findOne({ _id: id, isActive: true }).lean();
  if (!doc) return null;
  return listMedicines({ ...options, category: String(doc._id) });
}

export async function listAdvertisements(limit = 8) {
  const now = new Date();
  const docs = await Advertisement.find({
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  })
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(limit)
    .lean();

  return docs.map(serializeAdvertisement);
}

export async function listHealthTips(limit = 4) {
  const docs = await HealthTip.find({ isActive: true })
    .sort({ publishedAt: -1, sortOrder: 1 })
    .limit(limit)
    .lean();
  return docs.map(serializeHealthTip);
}

export async function getHomeData() {
  const [advertisements, categories, discounted, featured, advertised, healthTips] = await Promise.all([
    listAdvertisements(6),
    listCategories({ limit: 12 }),
    listMedicines({ discounted: true, limit: 8 }),
    listMedicines({ featured: true, limit: 8 }),
    listMedicines({ advertised: true, limit: 4 }),
    listHealthTips(4),
  ]);

  return {
    advertisements,
    categories: categories.items ?? categories,
    discountedMedicines: discounted.items,
    featuredMedicines: featured.items,
    advertisedMedicines: advertised.items,
    healthTips,
  };
}
