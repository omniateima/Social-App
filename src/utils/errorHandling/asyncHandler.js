export const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => {
        if (Object.keys(err)===0) {
            return next(new Error(err.message, {cause: 500}))
        }
      return next(err);
    });
  };
};
