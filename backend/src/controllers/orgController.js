import Department from '../models/Department.js';
import Team from '../models/Team.js';
import User from '../models/User.js';

// Build a hierarchical organisation tree of departments, teams and users
export const getOrgTree = async (_req, res, next) => {
  try {
    const departments = await Department.find();
    const teams = await Team.find();
    const users = await User.find().select('-password');

    // Step 1: Department map with placeholder children + teams
    const deptMap = {};
    departments.forEach((d) => {
      deptMap[d._id] = { ...d.toObject(), children: [], teams: [] };
    });

    // Step 2: Attach department children based on parent field
    const roots = [];
    departments.forEach((d) => {
      if (d.parent) {
        const parent = deptMap[d.parent];
        if (parent) parent.children.push(deptMap[d._id]);
      } else {
        roots.push(deptMap[d._id]);
      }
    });

    // Step 3: Build team map and attach to their departments
    const teamMap = {};
    teams.forEach((t) => {
      const obj = { ...t.toObject(), members: [] };
      teamMap[t._id] = obj;
      if (deptMap[t.department]) deptMap[t.department].teams.push(obj);
    });

    // Step 4: Attach users to their teams (Fixed: using teamId instead of team)
    users.forEach((u) => {
      if (u.teamId && teamMap[u.teamId]) {
        teamMap[u.teamId].members.push(u);
      }
    });

    return res.json(roots);
  } catch (err) {
    return next(err);
  }
};
