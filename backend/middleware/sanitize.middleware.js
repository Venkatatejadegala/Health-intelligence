/**
 * Middleware to sanitize user input against NoSQL Injection attacks.
 * It recursively deletes keys that start with '$' from request objects.
 */
const sanitizeObject = (obj) => {
  if (obj instanceof Object) {
    for (const key in obj) {
      if (key.startsWith('$')) {
        delete obj[key];
      } else if (obj[key] instanceof Object) {
        sanitizeObject(obj[key]);
      }
    }
  }
};

const sanitize = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};

module.exports = { sanitize };
