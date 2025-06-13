import logger from '../utils/logger.js';

// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  logger.error(err.stack || err.message);
  const status = err.status || 500;
  return res.status(status).json({ error: err.message || 'Server Error' });
}
