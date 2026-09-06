import ApiError from '../utils/ApiError.js';

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issueList = result.error?.issues || result.error?.errors || [];
      const errors = issueList.map((e) => ({
        field: Array.isArray(e.path) ? e.path.join('.') : e.path || '',
        message: e.message,
      }));
      const primaryMessage = errors[0]?.message || 'Validation failed';
      return next(new ApiError(400, primaryMessage, errors));
    }
    if (source === 'query') {
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req[source] = result.data;
    }
    next();
  };
};

export default validate;
