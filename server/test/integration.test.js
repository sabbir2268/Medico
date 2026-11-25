import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import request from 'supertest';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/medico-test';
process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

let app;
let User;
let Category;
let Medicine;
let Cart;
let Order;
let Payment;

before(async () => {
  ({ default: app } = await import('../src/app.js'));
  ({ User } = await import('../src/models/User.js'));
  ({ Category } = await import('../src/models/Category.js'));
  ({ Medicine } = await import('../src/models/Medicine.js'));
  ({ Cart } = await import('../src/models/Cart.js'));
  ({ Order } = await import('../src/models/Order.js'));
  ({ Payment } = await import('../src/models/Payment.js'));
  const { connectDatabase } = await import('../src/config/database.js');
  await connectDatabase();
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Medicine.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
  ]);
});

after(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
});

async function register(role = 'seller', email = `user${Date.now()}${Math.random()}@example.com`) {
  const response = await request(app).post('/api/auth/register').send({
    username: 'Test User',
    email,
    password: 'StrongPass1',
    role,
  });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  return { ...response.body.data, email };
}

describe('auth endpoints', () => {
  test('registers, logs in, reads profile and logs out', async () => {
    const session = await register();
    assert.equal(session.user.role, 'seller');
    assert.ok(session.accessToken);
    assert.ok(session.refreshToken);

    const duplicate = await request(app).post('/api/auth/register').send({
      username: 'Other User',
      email: session.email,
      password: 'StrongPass1',
    });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.code, 'EMAIL_IN_USE');

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${session.accessToken}`);
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.email, session.email);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: session.email, password: 'StrongPass1' });
    assert.equal(login.status, 200);

    const badLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: session.email, password: 'WrongPass1' });
    assert.equal(badLogin.status, 401);

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${session.accessToken}`);
    assert.equal(logout.status, 200);

    const afterLogout = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${session.accessToken}`);
    assert.equal(afterLogout.status, 401);
  });

  test('rejects self-assigned admin roles and invalid payloads', async () => {
    const escalation = await request(app).post('/api/auth/register').send({
      username: 'Bad Actor',
      email: `bad${Date.now()}@example.com`,
      password: 'StrongPass1',
      role: 'admin',
    });
    assert.equal(escalation.status, 400);
    assert.equal(escalation.body.code, 'VALIDATION_ERROR');

    const invalid = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: '' });
    assert.equal(invalid.status, 400);
  });

  test('profile updates cannot change the role', async () => {
    const session = await register();
    const response = await request(app)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({ username: 'Renamed User', role: 'admin' })
      .expect(200);

    assert.equal(response.body.data.user.username, 'Renamed User');
    assert.equal(response.body.data.user.role, 'seller');
    assert.equal(response.body.data.user.passwordHash, undefined);
  });
});

describe('catalog endpoints', () => {
  let categoryId;
  let medicineId;

  test('public list endpoints return the shared envelope', async () => {
    const home = await request(app).get('/api/home').expect(200);
    assert.equal(home.body.success, true);
    assert.ok(Array.isArray(home.body.data.categories));

    const categories = await request(app).get('/api/categories?active=true').expect(200);
    assert.ok(Array.isArray(categories.body.data.items));

    const medicines = await request(app).get('/api/medicines?page=1&limit=5').expect(200);
    assert.equal(medicines.body.data.pagination.page, 1);
    assert.ok(Array.isArray(medicines.body.data.items));
  });

  test('seller owns created medicines and buyer cannot modify them', async () => {
    const seller = await register('seller');
    const buyer = await register('user');

    const category = await Category.create({
      name: 'Test Category',
      slug: `test-${Date.now()}`,
      isActive: true,
    });
    categoryId = category._id;

    const created = await request(app)
      .post('/api/medicines')
      .set('Authorization', `Bearer ${seller.accessToken}`)
      .send({
        name: 'Test Medicine',
        category: String(categoryId),
        price: 100,
        discountPercent: 25,
        stock: 5,
      })
      .expect(201);

    medicineId = created.body.data.medicine.id;
    assert.equal(created.body.data.medicine.price, 75);
    assert.equal(created.body.data.medicine.originalPrice, 100);

    const forbidden = await request(app)
      .patch(`/api/medicines/${medicineId}`)
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .send({ price: 1 });
    assert.equal(forbidden.status, 403);

    const detail = await request(app).get(`/api/medicines/${medicineId}`).expect(200);
    assert.equal(detail.body.data.medicine.price, 75);

    const missing = await request(app).get('/api/medicines/not-an-id');
    assert.equal(missing.status, 400);
    assert.equal(missing.body.code, 'VALIDATION_ERROR');
  });
});

describe('cart endpoints', () => {
  test('validates stock, prevents cross-user access and recalculates totals', async () => {
    const buyer = await register('user');
    const other = await register('user');
    const category = await Category.create({
      name: 'Cart Category',
      slug: `cart-${Date.now()}`,
      isActive: true,
    });
    const medicine = await Medicine.create({
      name: 'Cart Medicine',
      category: category._id,
      seller: (await User.findOne({ email: buyer.email }))._id,
      price: 100,
      discountPercent: 10,
      stock: 2,
      status: 'active',
    });
    const medicineId = String(medicine._id);

    const added = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .send({ medicineId, quantity: 2 })
      .expect(200);
    assert.equal(added.body.data.cart.itemCount, 2);
    assert.equal(added.body.data.cart.subtotal, 200);
    assert.equal(added.body.data.cart.discount, 20);

    const overStock = await request(app)
      .patch(`/api/cart/items/${medicineId}`)
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .send({ quantity: 50 });
    assert.equal(overStock.status, 400);
    assert.equal(overStock.body.code, 'OUT_OF_STOCK');

    const otherCart = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${other.accessToken}`)
      .expect(200);
    assert.equal(otherCart.body.data.cart.itemCount, 0);

    await request(app)
      .delete(`/api/cart/items/${medicineId}`)
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);
    const empty = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);
    assert.equal(empty.body.data.cart.itemCount, 0);
  });
});

describe('order ownership and per-order identity', () => {
  const delivery = {
    fullName: 'Test Buyer',
    phone: '+880 1700 000000',
    addressLine1: '12 Test Street',
    city: 'Dhaka',
    postalCode: '1000',
    country: 'Bangladesh',
  };

  test('a new purchase after cancellation gets a new order id, and orders/payments stay owner-scoped', async () => {
    const buyer = await register('user');
    const other = await register('user');
    const buyerId = String((await User.findOne({ email: buyer.email }))._id);

    const category = await Category.create({
      name: `Order Category ${Date.now()}`,
      slug: `order-cat-${Date.now()}`,
      isActive: true,
    });
    const medicine = await Medicine.create({
      name: 'Order Medicine',
      category: category._id,
      seller: buyerId,
      price: 100,
      discountPercent: 0,
      stock: 10,
      status: 'active',
    });
    const medicineId = String(medicine._id);
    const auth = (session) => ({ Authorization: `Bearer ${session.accessToken}` });
    const reuseKey = `checkout-key-${Date.now()}`;

    // First order.
    await request(app)
      .post('/api/cart/items')
      .set(auth(buyer))
      .send({ medicineId, quantity: 1 })
      .expect(200);
    const first = await request(app)
      .post('/api/orders')
      .set(auth(buyer))
      .send({ idempotencyKey: reuseKey, delivery })
      .expect(201);
    const firstOrder = first.body.data.order;
    assert.equal(firstOrder.userId, buyerId);
    assert.ok(firstOrder.orderNumber.startsWith('MD-'));

    // Cancel it, then place another order with the SAME client key.
    await request(app)
      .post(`/api/users/orders/${firstOrder.id}/cancel`)
      .set(auth(buyer))
      .expect(200);

    await request(app)
      .post('/api/cart/items')
      .set(auth(buyer))
      .send({ medicineId, quantity: 1 })
      .expect(200);
    const second = await request(app)
      .post('/api/orders')
      .set(auth(buyer))
      .send({ idempotencyKey: reuseKey, delivery })
      .expect(201);
    const secondOrder = second.body.data.order;

    assert.notEqual(secondOrder.id, firstOrder.id);
    assert.notEqual(secondOrder.orderNumber, firstOrder.orderNumber);
    assert.equal(secondOrder.userId, buyerId);

    // Another user cannot read either order or list them.
    const denied = await request(app)
      .get(`/api/users/orders/${secondOrder.id}`)
      .set(auth(other));
    assert.equal(denied.status, 404);
    const otherList = await request(app).get('/api/users/orders').set(auth(other)).expect(200);
    assert.ok(
      !otherList.body.data.items.some((item) =>
        [firstOrder.id, secondOrder.id].includes(item.id),
      ),
    );

    // Another user cannot create a payment for somebody else's order.
    const deniedPayment = await request(app)
      .post('/api/payments/create-checkout-session')
      .set(auth(other))
      .send({ orderId: secondOrder.id });
    assert.equal(deniedPayment.status, 404);

    // Each order owns exactly one payment, readable only by its owner.
    const firstPayment = await Payment.create({
      user: buyerId,
      order: firstOrder.id,
      amount: 100,
      status: 'pending',
    });
    await Payment.create({ user: buyerId, order: secondOrder.id, amount: 100, status: 'pending' });
    await assert.rejects(() =>
      Payment.create({ user: buyerId, order: secondOrder.id, amount: 50, status: 'pending' }),
    );
    const deniedPaymentRead = await request(app)
      .get(`/api/payments/${firstPayment.id}`)
      .set(auth(other));
    assert.equal(deniedPaymentRead.status, 404);
  });
});
