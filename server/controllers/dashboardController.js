import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";

// @desc    Get rich dashboard stats
// @route   GET /api/dashboard
// @access  Private
export const getStats = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "Admin";
    const filter = isAdmin ? {} : { assignedTo: req.user._id };
    const now = new Date();

    // Core counts
    const [totalTasks, completedTasks, pendingTasks, inProgressTasks, overdueTasks, totalProjects, totalMembers] = await Promise.all([
      Task.countDocuments(filter),
      Task.countDocuments({ ...filter, status: "Done" }),
      Task.countDocuments({ ...filter, status: "Pending" }),
      Task.countDocuments({ ...filter, status: "In Progress" }),
      Task.countDocuments({ ...filter, status: { $ne: "Done" }, dueDate: { $lt: now } }),
      isAdmin ? Project.countDocuments() : Project.countDocuments({ members: req.user._id }),
      isAdmin ? User.countDocuments() : null,
    ]);

    // Monthly trend for last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setMonth(end.getMonth() + 1);
      const [created, done] = await Promise.all([
        Task.countDocuments({ ...filter, createdAt: { $gte: d, $lt: end } }),
        Task.countDocuments({ ...filter, status: "Done", updatedAt: { $gte: d, $lt: end } }),
      ]);
      months.push({
        month: d.toLocaleString("default", { month: "short" }),
        created,
        completed: done,
      });
    }

    // Project progress breakdown
    const projects = await Project.find(isAdmin ? {} : { members: req.user._id }).select("name members").populate("members", "_id");
    const projectProgress = await Promise.all(projects.map(async (p) => {
      const [total, done] = await Promise.all([
        Task.countDocuments({ project: p._id }),
        Task.countDocuments({ project: p._id, status: "Done" }),
      ]);
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        id: p._id,
        name: p.name,
        total,
        done,
        progress,
        status: progress === 100 ? "Completed" : progress >= 60 ? "On Track" : progress >= 30 ? "At Risk" : "Planning",
        members: p.members.length,
      };
    }));

    // Completion %
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Activity %
    const activityRate = totalTasks > 0 ? Math.round(((completedTasks + inProgressTasks) / totalTasks) * 100) : 0;

    res.status(200).json({
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      totalProjects,
      totalMembers: totalMembers || 1,
      completionRate,
      activityRate,
      monthlyTrend: months,
      projectProgress,
    });
  } catch (error) {
    next(error);
  }
};
