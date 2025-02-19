export  const globalErrorHandler = (error, req, res, next) => {
  const status = error.cause || 500;
  return res.status(status).json({
    success: false,
    message: error.message,
    stack: error.stack,
  });
};


export const notFoundHandler = (req, res, next) => {
  return res.status(404).json({
    success: false,
    message: "Not Found Handler!",
  });
}