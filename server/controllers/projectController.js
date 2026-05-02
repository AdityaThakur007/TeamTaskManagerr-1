import Project from "../models/Project.js";
import Task from "../models/Task.js";

const POPULATE = [
  { path: "createdBy", select: "name email" },
  { path: "members", select: "name email" },
];

// Enrich a project with live task stats
async function enrichProject(p) {
  const tasks = await Task.find({ project: p._id });
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "Done").length;
  const overdue = tasks.filter(
    (t) => t.status !== "Done" && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  // Auto-derive status if not manually set to Delayed/Completed
  let autoStatus = p.status;
  if (progress === 100) autoStatus = "Completed";
  else if (overdue > 0) autoStatus = p.endDate && new Date(p.endDate) < new Date() ? "Delayed" : "At Risk";
  else if (progress >= 50) autoStatus = "On Track";

  return {
    ...p.toObject(),
    taskCount: total,
    doneCount: done,
    overdueCount: overdue,
    progress,
    computedStatus: autoStatus,
  };
}

// GET /api/projects
export const getProjects = async (req, res, next) => {
  try {
    const filter = req.user.role === "Admin" ? {} : { members: req.user._id };
    const projects = await Project.find(filter).populate(POPULATE).sort({ createdAt: -1 });
    const enriched = await Promise.all(projects.map(enrichProject));
    res.json(enriched);
  } catch (e) { next(e); }
};

// GET /api/projects/:id
export const getProjectById = async (req, res, next) => {
  try {
    const p = await Project.findById(req.params.id).populate(POPULATE)
      .populate({ path: "activity.user", select: "name email" });
    if (!p) return res.status(404).json({ message: "Project not found" });

    const tasks = await Task.find({ project: p._id })
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    const enriched = await enrichProject(p);
    res.json({ ...enriched, tasks });
  } catch (e) { next(e); }
};

// POST /api/projects
export const createProject = async (req, res, next) => {
  try {
    const { name, description, members, priority, status, startDate, endDate } = req.body;
    if (!name) return res.status(400).json({ message: "Project name is required" });

    const project = await Project.create({
      name,
      description: description || "",
      createdBy: req.user._id,
      members: members || [],
      priority: priority || "Medium",
      status: status || "Planning",
      startDate: startDate || null,
      endDate: endDate || null,
      activity: [{ action: `Project created by ${req.user.name}`, user: req.user._id }],
    });

    const populated = await Project.findById(project._id).populate(POPULATE);
    const enriched = await enrichProject(populated);
    res.status(201).json(enriched);
  } catch (e) { next(e); }
};

// PUT /api/projects/:id
export const updateProject = async (req, res, next) => {
  try {
    const { name, description, priority, status, startDate, endDate } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (priority) project.priority = priority;
    if (status) project.status = status;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    project.activity.push({ action: `Project updated by ${req.user.name}`, user: req.user._id });

    await project.save();
    const populated = await Project.findById(project._id).populate(POPULATE);
    const enriched = await enrichProject(populated);
    res.json(enriched);
  } catch (e) { next(e); }
};

// POST /api/projects/:id/members
export const addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.members.map(String).includes(userId))
      return res.status(400).json({ message: "Already a member" });
    project.members.push(userId);
    project.activity.push({ action: `Member added by ${req.user.name}`, user: req.user._id });
    await project.save();
    const populated = await Project.findById(project._id).populate(POPULATE);
    res.json(await enrichProject(populated));
  } catch (e) { next(e); }
};

// DELETE /api/projects/:id/members/:userId
export const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    project.members = project.members.filter((m) => m.toString() !== req.params.userId);
    project.activity.push({ action: `Member removed by ${req.user.name}`, user: req.user._id });
    await project.save();
    const populated = await Project.findById(project._id).populate(POPULATE);
    res.json(await enrichProject(populated));
  } catch (e) { next(e); }
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();
    res.json({ id: req.params.id, message: "Project and tasks deleted" });
  } catch (e) { next(e); }
};
