/**
 * Centralized global error handling middleware
 */
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({ err: { message: err.message, stack: err.stack, name: err.name }, path: req.path, method: req.method }, 'Unhandled server error');

  // Handle JSON parsing errors
  if (err.type === 'entity.parse.failed') {
    return errorResponse(res, 'Request body contains invalid JSON', 400, 'INVALID_JSON');
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return errorResponse(res, 'Mongoose validation failed', 400, 'VALIDATION_ERROR', messages);
  }

  // Handle MongoDB Unique Index Conflict Errors
  if (err.code === 11000) {
    return errorResponse(res, 'Duplicate key error: A resource with this value already exists.', 409, 'RESOURCE_CONFLICT');
  }

  // Handle Unauthorized/Expired JWT Errors
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Access token is invalid or has expired.', 401, 'UNAUTHORIZED');
  }

  // Fallback server error
  return errorResponse(
    res,
    err.message || 'Internal Server Error',
    err.status || 500,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'development' ? [err.stack] : []
  );
};

module.exports = { errorHandler };
