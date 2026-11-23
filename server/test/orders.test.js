import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import request from 'supertest';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/medico-test-orders';
// Set empty (not delete): dotenv would otherwise reload them from .env.
process.env.STRIPE_SECRET_KEY = '';
process.env.STRIPE_WEBHOOK_SECRET = '';

let app;
let User;
let Category;
let Medicine;
let Cart;
let Order;

const delivery = {
  fullName: 'Asha Rahman',
  phone: '+8801712345678',
  addressLine1: '12 Green Road',
  addressLine2: 'Flat 3B',
  city: 'Dhaka',
  postalCode: '1205',
  country: 'Bangladesh',
  instructions: 'Leave at the door',
};

before(async () => {
  ({ default: app } = await import('../src/app.js'));
  ({ User } = await import('../src/models/User.js'));
  ({ Category } = await import('../src/models/Category.js'));
  ({ Medicine } = await import('../src/models/Medicine.js'));
  ({ Cart } = await import('../src/models/Cart.js'));
  ({ Order } = await import('../src/models/Order.js'));
  const { connectDatabase } = await import('../src/config/database.js');
  await connectDatabase();
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Medicine.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
  ]);
});

after(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
});

async function makeUser(email, role = 'user') {
  return User.create({
    username: email.split('@')[0],
    email,
    passwordHash: 'StrongPass1',
    role,
  });
}

async function tokenFor(user) {
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: 'StrongPass1' });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  return login.body.data.accessToken;
}

async function makeMedicine(seller, { price = 100, discountPercent = 20, stock = 5, prescriptionRequired = false } = {}) {
  const category = await Category.create({
    name: `Category ${Date.now()}${Math.random()}`,
    slug: `cat-${Date.now()}${Math.random()}`,
    isActive: true,
  });
  return Medicine.create({
    name: 'Test Medicine',
    category: category._id,
    seller: seller._id,
    price,
    discountPercent,
    stock,
    status: 'active',
    prescriptionRequired,
  });
}

describe('checkout orders', () => {
  test('creates an order from the cart with trusted prices and stock decrement', async () => {
    const seller = await makeUser(`seller${Date.now()}@example.com`, 'seller');
    const buyer = await makeUser(`buyer${Date.now()}@example.com`);
    const medicine = await makeMedicine(seller);
    const token = await tokenFor(buyer);

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ medicineId: String(medicine._id), quantity: 2 })
      .expect(200);

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ idempotencyKey: 'order-key-0001', delivery })
      .expect(201);

    const order = response.body.data.order;
    assert.equal(order.items[0].unitPrice, 80);
    assert.equal(order.items[0].originalPrice, 100);
    assert.equal(order.pricing.subtotal, 200);
    assert.equal(order.pricing.discount, 40);
    assert.equal(order.pricing.deliveryCharge, 60);
    assert.equal(order.pricing.total, 220);
    assert.equal(order.prescription.status, 'not_required');

    const refreshed = await Medicine.findById(medicine._id);
    assert.equal(refreshed.stock, 3);
    const cart = await Cart.findOne({ user: buyer._id });
    assert.equal(cart.items.length, 0);
  });

  test('idempotency key returns the same order and empty carts are rejected', async () => {
    const buyer = await makeUser(`idem${Date.now()}@example.com`);
    const token = await tokenFor(buyer);

    const empty = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ idempotencyKey: 'order-key-0002', delivery });
    assert.equal(empty.status, 400);
    assert.equal(empty.body.code, 'ORDER_EMPTY');

    const seller = await makeUser(`seller2${Date.now()}@example.com`, 'seller');
    const medicine = await makeMedicine(seller);
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ medicineId: String(medicine._id), quantity: 1 });

    const first = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ idempotencyKey: 'order-key-0003', delivery });
    const second = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ idempotencyKey: 'order-key-0003', delivery });

    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.equal(second.body.data.order.id, first.body.data.order.id);
  });

  test('requires prescription details for restricted medicines', async () => {
    const seller = await makeUser(`seller3${Date.now()}@example.com`, 'seller');
    const buyer = await makeUser(`rx${Date.now()}@example.com`);
    const medicine = await makeMedicine(seller, { prescriptionRequired: true });
    const token = await tokenFor(buyer);

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ medicineId: String(medicine._id), quantity: 1 });

    const blocked = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ idempotencyKey: 'order-key-0004', delivery });
    assert.equal(blocked.status, 400);
    assert.equal(blocked.body.code, 'PRESCRIPTION_REQUIRED');

    const allowed = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        idempotencyKey: 'order-key-0005',
        delivery,
        prescription: { prescriberName: 'Dr. Smith', prescriptionNumber: 'RX-12345' },
      })
      .expect(201);
    assert.equal(allowed.body.data.order.prescription.status, 'pending');
  });

  test('enforces ownership, pagination and cancellation stock rules', async () => {
    const seller = await makeUser(`seller4${Date.now()}@example.com`, 'seller');
    const buyer = await makeUser(`buyer4${Date.now()}@example.com`);
    const other = await makeUser(`other4${Date.now()}@example.com`);
    const medicine = await makeMedicine(seller, { stock: 4 });
    const token = await tokenFor(buyer);
    const otherToken = await tokenFor(other);

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ medicineId: String(medicine._id), quantity: 2 });
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ idempotencyKey: 'order-key-0006', delivery })
      .expect(201);
    const orderId = created.body.data.order.id;

    const foreign = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    assert.equal(foreign.status, 404);

    const listed = await request(app)
      .get('/api/users/orders?page=1&limit=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.equal(listed.body.data.pagination.limit, 1);
    assert.equal(listed.body.data.items.length, 1);

    const cancelled = await request(app)
      .post(`/api/users/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.equal(cancelled.body.data.order.status, 'cancelled');
    assert.equal((await Medicine.findById(medicine._id)).stock, 4);

    const again = await request(app)
      .post(`/api/users/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(again.status, 409);
    assert.equal(again.body.code, 'ORDER_NOT_CANCELLABLE');
  });

  test('generates a trusted PDF invoice and requires Stripe configuration for sessions', async () => {
    const seller = await makeUser(`seller5${Date.now()}@example.com`, 'seller');
    const buyer = await makeUser(`buyer5${Date.now()}@example.com`);
    const medicine = await makeMedicine(seller);
    const token = await tokenFor(buyer);

    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ medicineId: String(medicine._id), quantity: 1 });
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ idempotencyKey: 'order-key-0007', delivery })
      .expect(201);
    const orderId = created.body.data.order.id;

    const invoice = await request(app)
      .get(`/api/orders/${orderId}/invoice`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    assert.match(invoice.headers['content-type'], /application\/pdf/);
    assert.equal(invoice.body.subarray(0, 4).toString(), '%PDF');

    const session = await request(app)
      .post('/api/payments/create-checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId });
    assert.equal(session.status, 503);
    assert.equal(session.body.code, 'PAYMENT_NOT_CONFIGURED');
  });
});
