import express from 'express';
import {
  createTeam,
  listTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getTeamMembers
} from '../controllers/teamController.js';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';

const router = express.Router();

router.use(auth);

router.get('/', listTeams);
router.post('/', rbac(['admin', 'hr']), createTeam);
router.get('/:id', getTeam);
router.put('/:id', rbac(['admin', 'hr']), updateTeam);
router.patch('/:id', rbac(['admin', 'hr']), updateTeam);
router.delete('/:id', rbac(['admin', 'hr']), deleteTeam);

// Team member management routes
router.get('/:teamId/members', getTeamMembers);
router.post('/:teamId/members', rbac(['admin', 'hr', 'manager']), addTeamMember);
router.delete('/:teamId/members/:userId', rbac(['admin', 'hr', 'manager']), removeTeamMember);

export default router;
