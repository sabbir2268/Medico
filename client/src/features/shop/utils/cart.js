const CART_KEY = "medico.cart";
export const CART_CHANGE_EVENT = "medico:cart-change";

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  const count = items.reduce((total, item) => total + (Number(item.quantity) || 0), 0);

  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    /* Private mode: keep the in-memory count only. */
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CART_CHANGE_EVENT, { detail: { count } }));
  }

  return count;
}

export function getCartCount() {
  return readCart().reduce((total, item) => total + (Number(item.quantity) || 0), 0);
}

export function addToCart(medicine) {
  if (!medicine) return getCartCount();

  const id = medicine.id ?? medicine._id;

  if (!id) return getCartCount();

  const items = readCart();
  const index = items.findIndex((item) => (item.id ?? item._id) === id);

  if (index === -1) {
    items.push({
      id,
      name: medicine.name ?? "Medicine",
      price: Number(medicine.price) || 0,
      image: medicine.image ?? medicine.photoURL ?? null,
      quantity: 1,
    });
  } else {
    items[index] = { ...items[index], quantity: Number(items[index].quantity) + 1 };
  }

  return writeCart(items);
}

export function getCartItems() {
  return readCart();
}
