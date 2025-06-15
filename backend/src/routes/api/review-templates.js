import express from 'express';
import auth from '../../middleware/auth.js';
import rbac from '../../middleware/rbac.js';
import {
  getQuestionTemplates,
  createQuestionTemplate,
  updateQuestionTemplate,
  deleteQuestionTemplate
} from '../../controllers/reviewTemplateController.js';

const router = express.Router();

// @route   GET /api/v1/review-templates/questions
// @desc    Get all question templates
// @access  Admin, HR, Manager (for creating cycles)
router.get('/questions', auth, rbac(['admin', 'hr', 'manager']), getQuestionTemplates);

// @route   POST /api/v1/review-templates/questions
// @desc    Create new question template
// @access  Admin, HR only
router.post('/questions', auth, rbac(['admin', 'hr']), createQuestionTemplate);

// @route   PUT /api/v1/review-templates/questions/:id
// @desc    Update question template
// @access  Admin, HR only
router.put('/questions/:id', auth, rbac(['admin', 'hr']), updateQuestionTemplate);

// @route   DELETE /api/v1/review-templates/questions/:id
// @desc    Delete question template
// @access  Admin only
router.delete('/questions/:id', auth, rbac(['admin']), deleteQuestionTemplate);

export default router;
