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

function matches(item, id) {
  return (item.id ?? item._id) === id;
}

export function getCartCount() {
  return readCart().reduce((total, item) => total + (Number(item.quantity) || 0), 0);
}

export function addToCart(medicine, quantity = 1) {
  if (!medicine) return getCartCount();

  const id = medicine.id ?? medicine._id;

  if (!id) return getCartCount();

  const items = readCart();
  const index = items.findIndex((item) => matches(item, id));
  const amount = Math.max(1, Number(quantity) || 1);

  if (index === -1) {
    items.push({
      id,
      name: medicine.name ?? "Medicine",
      price: Number(medicine.price) || 0,
      image: medicine.image ?? medicine.photoURL ?? null,
      visual: medicine.visual ?? "capsule",
      tone: medicine.tone ?? "teal",
      manufacturer: medicine.manufacturer ?? medicine.vendor ?? "",
      quantity: amount,
    });
  } else {
    items[index] = {
      ...items[index],
      quantity: Number(items[index].quantity) + amount,
    };
  }

  return writeCart(items);
}

export function getCartItems() {
  return readCart();
}

/** Update the quantity of a medicine kept in the local (guest / demo) cart. */
export function updateLocalCartItem(id, quantity) {
  const amount = Math.max(1, Number(quantity) || 1);

  return writeCart(
    readCart().map((item) => (matches(item, id) ? { ...item, quantity: amount } : item)),
  );
}

/** Remove one medicine from the local (guest / demo) cart. */
export function removeLocalCartItem(id) {
  return writeCart(readCart().filter((item) => !matches(item, id)));
}

/** Clears the local guest cart after it has been merged into the user's cart. */
export function clearLocalCart() {
  return writeCart([]);
}

