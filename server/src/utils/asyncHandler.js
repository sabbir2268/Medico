export const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);


//easy way
// export const easyAsyncHandler = (fn) => {
//   return (req, res, next) => {
//     Promise.resolve(fn(req, res, next)).catch(next);
//   };
// };