/**
 * Standardized success and error response wrappers for API endpoints
 */

const successResponse = (res, data = {}, status = 200, metadata = {}) => {
  return res.status(status).json({
    success: true,
    timestamp: new Date().toISOString(),
    data,
    ...(Object.keys(metadata).length > 0 && { metadata })
  });
};

const errorResponse = (res, message = 'An error occurred', status = 500, code = 'INTERNAL_ERROR', details = []) => {
  return res.status(status).json({
    success: false,
    timestamp: new Date().toISOString(),
    error: {
      code,
      message,
      ...(details.length > 0 && { details })
    }
  });
};

module.exports = { successResponse, errorResponse };
