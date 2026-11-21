const FIREBASE_ERROR_MESSAGES = {
  "auth/account-exists-with-different-credential":
    "An account already exists with this email using another sign-in method.",
  "auth/credential-already-in-use":
    "This sign-in method is already linked to another account.",
  "auth/email-already-in-use": "An account already exists with this email.",
  "auth/invalid-api-key": "Firebase is misconfigured. Check the environment variables.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/missing-password": "Enter your password.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase.",
  "auth/popup-blocked": "The sign-in popup was blocked. Allow popups and try again.",
  "auth/popup-closed-by-user": "The sign-in popup was closed before completing.",
  "auth/requires-recent-login": "Please sign in again before changing your profile.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/weak-password": "Choose a stronger password.",
  "auth/wrong-password": "Incorrect email or password.",
};

export function getAuthErrorMessage(error) {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error.code && FIREBASE_ERROR_MESSAGES[error.code]) {
    return FIREBASE_ERROR_MESSAGES[error.code];
  }

  if (typeof error.message === "string" && error.message.trim() !== "") {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
