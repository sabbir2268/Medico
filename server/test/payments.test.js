import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import request from 'supertest';
import mongoose from 'mongoose';
import Stripe from 'stripe';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/medico-test-payments';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key';
const WEBHOOK_SECRET = 'whsec_test_secret';
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

let app;
let User;
let Order;
let Payment;
let token;
let buyer;
let orderId;
let paymentId;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function signedRequest(payload, secret = WEBHOOK_SECRET) {
  return stripe.webhooks.generateTestHeaderString({ payload, secret });
}

before(async () => {
  ({ default: app } = await import('../src/app.js'));
  ({ User } = await import('../src/models/User.js'));
  ({ Order } = await import('../src/models/Order.js'));
  ({ Payment } = await import('../src/models/Payment.js'));
  const { connectDatabase } = await import('../src/config/database.js');
  await connectDatabase();
  await Promise.all([User.deleteMany({}), Order.deleteMany({}), Payment.deleteMany({})]);

  buyer = await User.create({
    username: 'paybuyer',
    email: `paybuyer${Date.now()}@example.com`,
    passwordHash: 'StrongPass1',
  });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: buyer.email, password: 'StrongPass1' });
  token = login.body.data.accessToken;

  const order = await Order.create({
    user: buyer._id,
    items: [
      {
        medicine: new mongoose.Types.ObjectId(),
        medicineId: 'med-1',
        name: 'Payment Test Medicine',
        quantity: 1,
        unitPrice: 75,
        originalPrice: 100,
        discountPercent: 25,
        lineTotal: 75,
        lineSavings: 25,
      },
    ],
    delivery: {
      fullName: 'Asha',
      phone: '+8801712345678',
      addressLine1: '12 Green Road',
      city: 'Dhaka',
      postalCode: '1205',
      country: 'Bangladesh',
    },
    pricing: { subtotal: 100, discount: 25, deliveryCharge: 60, total: 135 },
  });
  orderId = String(order._id);

  const payment = await Payment.create({
    user: buyer._id,
    order: order._id,
    stripeSessionId: 'cs_test_webhook_123',
    amount: 135,
    status: 'pending',
  });
  paymentId = String(payment._id);
});

after(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
});

describe('payment webhooks and ownership', () => {
  test('rejects invalid signatures and missing headers', async () => {
    const payload = JSON.stringify({
      id: 'evt_invalid',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_webhook_123', payment_status: 'paid' } },
    });

    const invalid = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', signedRequest(payload, 'whsec_wrong_secret'))
      .send(payload);
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.code, 'WEBHOOK_INVALID_SIGNATURE');

    const missing = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .send(payload);
    assert.equal(missing.status, 400);
  });

  test('marks payment and order paid only from a verified completed event', async () => {
    const payload = JSON.stringify({
      id: 'evt_completed_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_webhook_123',
          payment_status: 'paid',
          payment_intent: 'pi_test_123',
        },
      },
    });

    const response = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', signedRequest(payload))
      .send(payload)
      .expect(200);
    assert.equal(response.body.received, true);
    assert.equal(response.body.processed, true);

    const payment = await Payment.findById(paymentId);
    assert.equal(payment.status, 'paid');
    assert.equal(payment.stripePaymentIntentId, 'pi_test_123');

    const order = await Order.findById(orderId);
    assert.equal(order.paymentStatus, 'paid');
    assert.equal(order.status, 'processing');
  });

  test('duplicate webhook events are ignored', async () => {
    const payload = JSON.stringify({
      id: 'evt_completed_1',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_webhook_123', payment_status: 'paid' } },
    });

    const response = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', signedRequest(payload))
      .send(payload)
      .expect(200);
    assert.equal(response.body.duplicate, true);
    assert.equal(response.body.processed, false);
  });

  test('payment retrieval is scoped to the owner and payment history is paginated', async () => {
    const bySession = await request(app)
      .get('/api/payments/cs_test_webhook_123')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.equal(bySession.body.data.payment.id, paymentId);

    const byOrder = await request(app)
      .get(`/api/payments/${orderId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.equal(byOrder.body.data.payment.status, 'paid');

    const other = await User.create({
      username: 'otherpay',
      email: `otherpay${Date.now()}@example.com`,
      passwordHash: 'StrongPass1',
    });
    const otherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: other.email, password: 'StrongPass1' });
    const foreign = await request(app)
      .get('/api/payments/cs_test_webhook_123')
      .set('Authorization', `Bearer ${otherLogin.body.data.accessToken}`);
    assert.equal(foreign.status, 404);

    const history = await request(app)
      .get('/api/users/payments?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.equal(history.body.data.items.length, 1);
    assert.equal(history.body.data.pagination.total, 1);
  });
});
