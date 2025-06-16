import express from 'express';
import {
  createTimeEntry,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
  getTimeAnalytics
} from '../controllers/timeEntryController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.use(auth);

router.post('/', createTimeEntry);
router.get('/', getTimeEntries);
router.get('/analytics', getTimeAnalytics);
router.get('/summary', getTimeAnalytics); // Alias for frontend compatibility
router.patch('/:id', updateTimeEntry);
router.put('/:id', updateTimeEntry); // Support both PATCH and PUT for updates
router.delete('/:id', deleteTimeEntry);

export default router;
