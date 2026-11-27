/** Returns only fields that are safe to send to the client. */
export function sanitizeUser(user) {
  if (!user) return null;

  const source = typeof user.toObject === 'function' ? user.toObject() : user;

  return {
    id: source.id ?? String(source._id ?? ''),
    firebaseUid: source.firebaseUid ?? null,
    username: source.username ?? source.displayName ?? '',
    email: source.email,
    provider: source.provider ?? 'password',
    displayName: source.displayName ?? '',
    photoURL: source.photoURL ?? '',
    phone: source.phone ?? '',
    address: source.address ?? {
      addressLine1: '',
      addressLine2: '',
      city: '',
      postalCode: '',
      country: 'Bangladesh',
    },
    role: source.role,
    sellerStatus: source.sellerStatus ?? 'approved',
    isActive: source.isActive !== false,
    createdAt: source.createdAt ?? null,
    updatedAt: source.updatedAt ?? null,
  };
}
