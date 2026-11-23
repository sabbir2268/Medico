import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import request from 'supertest';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/medico-test-admin';
// Set empty (not delete): dotenv would otherwise reload them from .env.
process.env.STRIPE_SECRET_KEY = '';
process.env.STRIPE_WEBHOOK_SECRET = '';

let app;
let User;
let Category;
let Medicine;
let Order;
let Payment;
let Advertisement;
let HealthTip;
let AuditLog;
let adminToken;
let sellerToken;
let userToken;
let adminUser;
let sellerUser;

async function tokenFor(email) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'StrongPass1' });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  return response.body.data.accessToken;
}

async function createUser(email, role) {
  return User.create({
    username: email.split('@')[0],
    email,
    // The User model hashes this on save; double-hashing would break login.
    passwordHash: 'StrongPass1',
    role,
  });
}

before(async () => {
  ({ default: app } = await import('../src/app.js'));
  ({ User } = await import('../src/models/User.js'));
  ({ Category } = await import('../src/models/Category.js'));
  ({ Medicine } = await import('../src/models/Medicine.js'));
  ({ Order } = await import('../src/models/Order.js'));
  ({ Payment } = await import('../src/models/Payment.js'));
  ({ Advertisement } = await import('../src/models/Advertisement.js'));
  ({ HealthTip } = await import('../src/models/HealthTip.js'));
  ({ AuditLog } = await import('../src/models/AuditLog.js'));
  const { connectDatabase } = await import('../src/config/database.js');
  await connectDatabase();
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Medicine.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
    Advertisement.deleteMany({}),
    HealthTip.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  adminUser = await createUser('admin@test.example', 'admin');
  await createUser('admin2@test.example', 'admin');
  sellerUser = await createUser('seller@test.example', 'seller');
  const regular = await createUser('user@test.example', 'user');

  [adminToken, sellerToken, userToken] = await Promise.all([
    tokenFor(adminUser.email),
    tokenFor(sellerUser.email),
    tokenFor(regular.email),
  ]);
});

after(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
});

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('admin authorization', () => {
  test('rejects non-admin roles on every admin endpoint', async () => {
    for (const token of [sellerToken, userToken]) {
      const dashboard = await request(app).get('/api/admin/dashboard').set(auth(token));
      assert.equal(dashboard.status, 403);
      assert.equal(dashboard.body.code, 'FORBIDDEN');

      const users = await request(app).get('/api/admin/users').set(auth(token));
      assert.equal(users.status, 403);
    }
  });

  test('anonymous requests are unauthorized', async () => {
    const response = await request(app).get('/api/admin/dashboard');
    assert.equal(response.status, 401);
  });
});

describe('admin overview and reports', () => {
  test('dashboard and analytics use verified payments', async () => {
    const order = await Order.create({
      user: sellerUser._id,
      items: [
        {
          medicine: new mongoose.Types.ObjectId(),
          medicineId: 'med-1',
          name: 'Test',
          quantity: 2,
          unitPrice: 50,
          originalPrice: 60,
          lineTotal: 100,
          lineSavings: 20,
          seller: sellerUser._id,
        },
      ],
      delivery: {
        fullName: 'A', phone: '1234567', addressLine1: 'Street', city: 'Dhaka',
        postalCode: '1000', country: 'Bangladesh',
      },
      pricing: { subtotal: 120, discount: 20, deliveryCharge: 0, total: 100 },
      paymentStatus: 'paid',
      status: 'processing',
    });
    await Payment.create({
      user: sellerUser._id,
      order: order._id,
      amount: 100,
      status: 'paid',
    });

    const dashboard = await request(app).get('/api/admin/dashboard').set(auth(adminToken)).expect(200);
    assert.equal(dashboard.body.data.revenue, 100);
    assert.ok(dashboard.body.data.orders >= 1);

    const analytics = await request(app).get('/api/admin/analytics').set(auth(adminToken)).expect(200);
    assert.equal(analytics.body.data.summary.revenue, 100);
    assert.ok(analytics.body.data.series.length >= 1);
  });

  test('exports CSV and PDF sales reports', async () => {
    const csv = await request(app)
      .get('/api/admin/reports/sales?format=csv')
      .set(auth(adminToken))
      .expect(200);
    assert.match(csv.headers['content-type'], /text\/csv/);
    assert.match(csv.text, /Date,Order,Amount,Status,Provider/);

    const pdf = await request(app)
      .get('/api/admin/reports/sales?format=pdf')
      .set(auth(adminToken))
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    assert.match(pdf.headers['content-type'], /application\/pdf/);
    assert.equal(pdf.body.subarray(0, 4).toString(), '%PDF');
  });
});

describe('admin user and seller management', () => {
  test('lists users, updates roles and records audit entries', async () => {
    const target = await createUser('target@test.example', 'user');
    const list = await request(app).get('/api/admin/users?search=target&limit=5').set(auth(adminToken)).expect(200);
    assert.equal(list.body.data.items.length, 1);
    assert.equal(list.body.data.pagination.total, 1);

    const changed = await request(app)
      .patch(`/api/admin/users/${target._id}/role`)
      .set(auth(adminToken))
      .send({ role: 'seller' })
      .expect(200);
    assert.equal(changed.body.data.user.role, 'seller');

    const logs = await request(app).get('/api/admin/audit-logs').set(auth(adminToken)).expect(200);
    assert.ok(logs.body.data.items.some((log) => log.action === 'USER_ROLE_CHANGED'));
  });

  test('blocks users, invalidates tokens and protects self/last admin', async () => {
    const target = await createUser('blockme@test.example', 'user');
    const token = await tokenFor(target.email);

    await request(app)
      .patch(`/api/admin/users/${target._id}/status`)
      .set(auth(adminToken))
      .send({ isActive: false })
      .expect(200);
    const denied = await request(app).get('/api/auth/me').set(auth(token));
    assert.equal(denied.status, 401);

    const self = await request(app)
      .patch(`/api/admin/users/${adminUser._id}/status`)
      .set(auth(adminToken))
      .send({ isActive: false });
    assert.equal(self.status, 400);
    assert.equal(self.body.code, 'CANNOT_MODIFY_SELF');

    // Direct service call: make the target the only active admin.
    const soleAdmin = await createUser('sole@test.example', 'admin');
    await User.updateMany({ _id: { $ne: soleAdmin._id }, role: 'admin' }, { $set: { isActive: false } });
    const { deleteUser } = await import('../src/services/admin.service.js');
    await assert.rejects(
      () => deleteUser(new mongoose.Types.ObjectId(), soleAdmin._id, {}),
      (error) => error.code === 'LAST_ADMIN',
    );

    // Restore the acting admin so later tests keep a valid token.
    await User.updateOne({ _id: adminUser._id }, { $set: { isActive: true } });
  });

  test('manages seller approval status', async () => {
    const response = await request(app)
      .patch(`/api/admin/sellers/${sellerUser._id}/status`)
      .set(auth(adminToken))
      .send({ sellerStatus: 'suspended', reason: 'Review needed' })
      .expect(200);
    assert.equal(response.body.data.seller.sellerStatus, 'suspended');

    const filtered = await request(app)
      .get('/api/admin/sellers?status=suspended')
      .set(auth(adminToken))
      .expect(200);
    assert.ok(filtered.body.data.items.some((seller) => seller.id === String(sellerUser._id)));
  });
});

describe('admin catalog management', () => {
  test('creates, updates and deletes categories with in-use protection', async () => {
    const created = await request(app)
      .post('/api/admin/categories')
      .set(auth(adminToken))
      .send({ name: 'Admin Category', description: 'Test' })
      .expect(201);
    const id = created.body.data.category.id;
    assert.equal(created.body.data.category.slug, 'admin-category');

    await request(app)
      .patch(`/api/admin/categories/${id}`)
      .set(auth(adminToken))
      .send({ isActive: false })
      .expect(200);

    const medicine = await Medicine.create({
      name: 'In use',
      category: new mongoose.Types.ObjectId(id),
      seller: sellerUser._id,
      price: 10,
      stock: 1,
      status: 'active',
    });
    const inUse = await request(app)
      .delete(`/api/admin/categories/${id}`)
      .set(auth(adminToken));
    assert.equal(inUse.status, 409);
    assert.equal(inUse.body.code, 'CATEGORY_IN_USE');

    await Medicine.deleteOne({ _id: medicine._id });
    await request(app).delete(`/api/admin/categories/${id}`).set(auth(adminToken)).expect(200);
  });

  test('approves and hides medicines', async () => {
    const category = await Category.create({ name: 'Rx', slug: `rx-${Date.now()}`, isActive: true });
    const medicine = await Medicine.create({
      name: 'Admin Medicine',
      category: category._id,
      seller: sellerUser._id,
      price: 100,
      discountPercent: 20,
      stock: 5,
      status: 'active',
      isApproved: false,
      isHidden: true,
    });

    await request(app)
      .patch(`/api/admin/medicines/${medicine._id}/status`)
      .set(auth(adminToken))
      .send({ status: 'approved' })
      .expect(200);
    assert.equal((await Medicine.findById(medicine._id)).isApproved, true);
    assert.equal((await Medicine.findById(medicine._id)).isHidden, false);

    await request(app)
      .patch(`/api/admin/medicines/${medicine._id}/status`)
      .set(auth(adminToken))
      .send({ status: 'hidden' })
      .expect(200);
    const publicList = await request(app).get('/api/medicines?search=Admin Medicine').expect(200);
    assert.equal(publicList.body.data.items.length, 0);
  });
});

describe('admin advertisements and health tips', () => {
  test('advertisements require approval before public display', async () => {
    const ad = await Advertisement.create({
      title: 'Seller promo',
      seller: sellerUser._id,
      status: 'pending',
      isActive: true,
    });

    const before = await request(app).get('/api/advertisements/active').expect(200);
    assert.equal(before.body.data.items.some((item) => item.id === String(ad._id)), false);

    await request(app)
      .patch(`/api/admin/advertisements/${ad._id}/status`)
      .set(auth(adminToken))
      .send({ status: 'approved' })
      .expect(200);

    const after = await request(app).get('/api/advertisements/active').expect(200);
    assert.equal(after.body.data.items.some((item) => item.id === String(ad._id)), true);
  });

  test('creates, updates and deletes health tips', async () => {
    const created = await request(app)
      .post('/api/admin/health-tips')
      .set(auth(adminToken))
      .send({ title: 'Stay hydrated', excerpt: 'Drink water', isActive: true })
      .expect(201);
    const id = created.body.data.healthTip.id;

    const updated = await request(app)
      .patch(`/api/admin/health-tips/${id}`)
      .set(auth(adminToken))
      .send({ isActive: false });
    assert.equal(updated.status, 200, JSON.stringify(updated.body));
    assert.equal((await HealthTip.findById(id)).isActive, false);

    await request(app).delete(`/api/admin/health-tips/${id}`).set(auth(adminToken)).expect(200);
    assert.equal(await HealthTip.findById(id), null);
  });
});
