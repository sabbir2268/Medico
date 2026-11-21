/**
 * Firebase stores the identity (uid, email, display name, photo) but knows
 * nothing about Medico's app-level role. Keep the small profile record in
 * localStorage, keyed by uid, until a backend profile store exists.
 */
const PROFILES_KEY = "medico.auth.profiles";

function readAllProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);

    if (!raw) return {};

    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeAllProfiles(profiles) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    /* Storage can be unavailable (private mode); the in-memory user still works. */
  }
}

export function readLocalProfile(uid) {
  if (!uid) return null;

  const profile = readAllProfiles()[uid];

  return profile && typeof profile === "object" ? profile : null;
}

export function writeLocalProfile(uid, profile) {
  if (!uid || !profile) return null;

  const profiles = readAllProfiles();
  const next = { ...profiles[uid], ...profile };

  profiles[uid] = next;
  writeAllProfiles(profiles);

  return next;
}

export function clearLocalProfile(uid) {
  if (!uid) return;

  const profiles = readAllProfiles();

  delete profiles[uid];
  writeAllProfiles(profiles);
}
