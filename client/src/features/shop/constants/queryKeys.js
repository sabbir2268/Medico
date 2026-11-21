export const shopKeys = {
  all: ["shop"],
  medicines: (params) => [...shopKeys.all, "medicines", params],
};
