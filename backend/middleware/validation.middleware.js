const { errorResponse } = require('../utils/response');

/**
 * Middleware helper to validate request body parameters and data types
 */
const validateBody = (rules) => {
  return (req, res, next) => {
    if (!req.body) {
      return errorResponse(res, 'Request body is required.', 400, 'VALIDATION_ERROR');
    }
    
    for (const [key, type] of Object.entries(rules)) {
      const val = req.body[key];
      
      // Enforce presence of required parameters
      if (val === undefined) {
        const code = key === 'idToken' ? 'ID_TOKEN_REQUIRED' : 'VALIDATION_ERROR';
        const msg = key === 'idToken' ? 'Firebase ID token is required' : `Parameter '${key}' is required.`;
        return errorResponse(res, msg, 400, code);
      }
      
      if (type === 'string') {
        if (typeof val !== 'string') {
          return errorResponse(res, `Parameter '${key}' must be a string.`, 400, 'VALIDATION_ERROR');
        }
        if (val.trim() === '') {
          return errorResponse(res, `Parameter '${key}' cannot be empty.`, 400, 'VALIDATION_ERROR');
        }
      }
      if (type === 'number') {
        if (val === null || isNaN(Number(val))) {
          return errorResponse(res, `Parameter '${key}' must be a number.`, 400, 'VALIDATION_ERROR');
        }
      }
      if (type === 'array' && !Array.isArray(val)) {
        return errorResponse(res, `Parameter '${key}' must be an array.`, 400, 'VALIDATION_ERROR');
      }
      if (type === 'boolean' && typeof val !== 'boolean') {
        return errorResponse(res, `Parameter '${key}' must be a boolean.`, 400, 'VALIDATION_ERROR');
      }
    }
    next();
  };
};

module.exports = { validateBody };
