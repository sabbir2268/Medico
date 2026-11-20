import { toast } from "sonner";

const defaultOptions = {
  duration: 4000,
};

function withDefaults(options) {
  return { ...defaultOptions, ...options };
}

function getErrorMessage(message) {
  return message instanceof Error ? message.message : message;
}

export const notify = {
  success: (message, options) => toast.success(message, withDefaults(options)),
  error: (message, options) =>
    toast.error(getErrorMessage(message), withDefaults(options)),
  info: (message, options) => toast.info(message, withDefaults(options)),
  warning: (message, options) => toast.warning(message, withDefaults(options)),
  loading: (message, options) => toast.loading(message, withDefaults(options)),
  promise: (promise, messages, options) =>
    toast.promise(promise, messages, withDefaults(options)),
  dismiss: toast.dismiss,
};
