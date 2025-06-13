import Department from '../models/Department.js';
import Team from '../models/Team.js';
import User from '../models/User.js';

export const getOrgTree = async (_req, res, next) => {
  try {
    const departments = await Department.find();
    const teams = await Team.find();
    const users = await User.find().select('-password');

    const deptMap = {};
    departments.forEach((d) => {
      deptMap[d._id] = { ...d.toObject(), teams: [] };
    });

    const teamMap = {};
    teams.forEach((t) => {
      const obj = { ...t.toObject(), members: [] };
      teamMap[t._id] = obj;
      if (deptMap[t.department]) deptMap[t.department].teams.push(obj);
    });

    users.forEach((u) => {
      if (u.team && teamMap[u.team]) {
        teamMap[u.team].members.push(u);
      }
    });

    return res.json(Object.values(deptMap));
  } catch (err) {
    return next(err);
  }
};
