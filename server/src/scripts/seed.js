/**
 * Controlled development seed. Idempotent: safe to run repeatedly.
 * Usage: npm run seed (requires MONGODB_URI in server/.env)
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ROLES } from '../constants/roles.js';
import { Category } from '../models/Category.js';
import { Medicine } from '../models/Medicine.js';
import { Advertisement } from '../models/Advertisement.js';
import { HealthTip } from '../models/HealthTip.js';
import { User } from '../models/User.js';

const CATEGORIES = [
  { name: 'Pain Relief', slug: 'pain-relief', visual: 'capsule', tone: 'teal', description: 'Trusted relief for everyday aches and pains.' },
  { name: 'Vitamins & Supplements', slug: 'vitamins', visual: 'vitamin', tone: 'emerald', description: 'Daily nutrition and immune support.' },
  { name: 'Cold & Flu', slug: 'cold-flu', visual: 'syrup', tone: 'blue', description: 'Care for seasonal coughs, colds and flu.' },
  { name: 'Digestive Health', slug: 'digestive-health', visual: 'droplet', tone: 'amber', description: 'Gut health, antacids and digestive care.' },
  { name: 'Skin Care', slug: 'skin-care', visual: 'shield', tone: 'rose', description: 'Dermatology-approved skin treatments.' },
  { name: 'Diabetes Care', slug: 'diabetes-care', visual: 'diabetes', tone: 'cyan', description: 'Monitoring and medicines for diabetes.' },
  { name: 'Heart Health', slug: 'heart-health', visual: 'heart', tone: 'violet', description: 'Cardiovascular support and medicines.' },
  { name: 'First Aid', slug: 'first-aid', visual: 'firstaid', tone: 'emerald', description: 'Essentials for wounds and emergencies.' },
  { name: 'Baby & Child', slug: 'baby-child', visual: 'baby', tone: 'amber', description: 'Gentle care for infants and children.' },
  { name: 'Medical Devices', slug: 'medical-devices', visual: 'device', tone: 'teal', description: 'Monitors, thermometers and supports.' },
];

const TIPS = [
  { title: 'How to store medicines safely at home', slug: 'store-medicines-safely', excerpt: 'Keep medicines cool, dry and out of reach of children.', category: 'Safety', visual: 'shield', tone: 'teal' },
  { title: 'Understanding generic medicines', slug: 'understanding-generics', excerpt: 'Generics contain the same active ingredient as brand medicines.', category: 'Education', visual: 'capsule', tone: 'emerald' },
  { title: 'Staying hydrated during summer', slug: 'staying-hydrated', excerpt: 'Simple habits to keep your body hydrated in hot weather.', category: 'Wellness', visual: 'droplet', tone: 'blue' },
  { title: 'A beginner’s guide to vitamins', slug: 'beginners-guide-vitamins', excerpt: 'Which vitamins you need and when to take them.', category: 'Nutrition', visual: 'vitamin', tone: 'amber' },
  { title: 'When to see a pharmacist first', slug: 'when-to-see-pharmacist', excerpt: 'Pharmacists can help with many common health concerns.', category: 'Care', visual: 'heart', tone: 'rose' },
  { title: 'Managing seasonal allergies', slug: 'managing-allergies', excerpt: 'Reduce exposure and know your treatment options.', category: 'Wellness', visual: 'leaf', tone: 'violet' },
];

const MEDICINES = [
  ['Paracetamol 500mg', 'Paracetamol', 'Medico Pharma', 'pain-relief', 18, 15, 120, true, true, 'Tablet'],
  ['Ibuprofen 400mg', 'Ibuprofen', 'Wellcare Labs', 'pain-relief', 25, 10, 85, false, false, 'Tablet'],
  ['Vitamin C 1000mg', 'Ascorbic Acid', 'NutriLife', 'vitamins', 120, 20, 200, true, false, 'Tablet'],
  ['Multivitamin Daily', 'Multivitamin', 'NutriLife', 'vitamins', 240, 25, 90, false, false, 'Capsule'],
  ['Cetirizine 10mg', 'Cetirizine', 'Wellcare Labs', 'cold-flu', 22, 12, 150, false, true, 'Tablet'],
  ['Cold & Flu Syrup', 'Paracetamol + Phenylephrine', 'Medico Pharma', 'cold-flu', 85, 18, 70, false, false, 'Syrup'],
  ['Omeprazole 20mg', 'Omeprazole', 'Gut Health Co.', 'digestive-health', 95, 22, 110, true, false, 'Capsule'],
  ['Antacid Suspension', 'Aluminium + Magnesium', 'Gut Health Co.', 'digestive-health', 70, 10, 60, false, false, 'Syrup'],
  ['Vitamin E Cream', 'Tocopherol', 'DermaCare', 'skin-care', 180, 30, 45, false, false, 'Bottle'],
  ['Sunscreen SPF 50', 'Sun Protection', 'DermaCare', 'skin-care', 320, 15, 80, true, true, 'Bottle'],
  ['Metformin 500mg', 'Metformin', 'Diabet Care', 'diabetes-care', 35, 8, 130, false, false, 'Tablet'],
  ['Glucometer Strips', 'Test Strips', 'Diabet Care', 'diabetes-care', 450, 12, 55, false, false, 'Device'],
  ['Aspirin 75mg', 'Aspirin', 'Cardio Care', 'heart-health', 28, 10, 140, false, false, 'Tablet'],
  ['Bandage Kit', 'First Aid', 'SafeGuard', 'first-aid', 160, 20, 95, false, false, 'First Aid'],
  ['Baby Paracetamol Drops', 'Paracetamol', 'LittleCare', 'baby-child', 75, 15, 65, false, false, 'Drops'],
  ['Digital Thermometer', 'Thermometer', 'SafeGuard', 'medical-devices', 290, 25, 40, true, true, 'Device'],
];

async function seed() {
  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
  });
  logger.info('Connected to MongoDB for seeding.');

  const categories = [];
  for (const [index, data] of CATEGORIES.entries()) {
    const doc = await Category.findOneAndUpdate(
      { slug: data.slug },
      { $set: { ...data, isActive: true, sortOrder: index } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    categories.push(doc);
  }

  for (const [index, data] of TIPS.entries()) {
    await HealthTip.findOneAndUpdate(
      { slug: data.slug },
      { $set: { ...data, isActive: true, publishedAt: new Date(), sortOrder: index, content: data.excerpt } },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  const sellerHash = await bcrypt.hash('Seller@123', 12);
  const adminHash = await bcrypt.hash('Admin@123', 12);

  const seller = await User.findOneAndUpdate(
    { email: 'seller@medico.test' },
    {
      $set: {
        username: 'Medico Vendor',
        passwordHash: sellerHash,
        role: ROLES.SELLER,
        isActive: true,
        provider: 'password',
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  await User.findOneAndUpdate(
    { email: 'admin@medico.test' },
    {
      $set: {
        username: 'Medico Admin',
        passwordHash: adminHash,
        role: ROLES.ADMIN,
        isActive: true,
        provider: 'password',
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );

  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

  for (const [index, row] of MEDICINES.entries()) {
    const [name, genericName, manufacturer, slug, price, discountPercent, stock, isFeatured, isAdvertised, form] = row;
    const sku = `MED-${String(index + 1).padStart(4, '0')}`;
    await Medicine.findOneAndUpdate(
      { sku },
      {
        $set: {
          name,
          genericName,
          manufacturer,
          form,
          category: categoryBySlug.get(slug)._id,
          seller: seller._id,
          price,
          discountPercent,
          stock,
          status: 'active',
          isFeatured,
          isAdvertised,
          description: `${name} from ${manufacturer}. Quality assured and delivered by verified vendors.`,
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  const firstMedicine = await Medicine.findOne({ isAdvertised: true });
  if (firstMedicine) {
    await Advertisement.findOneAndUpdate(
      { title: 'Trusted care, delivered' },
      {
        $set: {
          title: 'Trusted care, delivered',
          subtitle: 'Save up to 30% on everyday essentials from verified pharmacies.',
          medicine: firstMedicine._id,
          ctaText: 'Shop deals',
          ctaLink: '/deals',
          visual: 'capsule',
          tone: 'teal',
          isActive: true,
          sortOrder: 0,
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  logger.info(`Seed complete: ${CATEGORIES.length} categories, ${MEDICINES.length} medicines, ${TIPS.length} health tips.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  logger.error(`Seed failed: ${error.stack || error.message}`);
  await mongoose.disconnect();
  process.exitCode = 1;
});
