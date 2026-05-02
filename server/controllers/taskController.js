import Task from "../models/Task.js";

// @desc    Get tasks (Admin sees all, Member sees only assigned)
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res, next) => {
  try {
    const filter = req.user.role === "Admin" ? {} : { assignedTo: req.user._id };
    const tasks = await Task.find(filter)
      .populate("project", "name")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a task (Assign to user)
// @route   POST /api/tasks
// @access  Private/Admin
export const createTask = async (req, res, next) => {
  try {
    const { title, description, project, assignedTo, status, dueDate } = req.body;

    if (!title || !project) {
      return res.status(400).json({ message: "Please provide task title and project" });
    }

    const task = await Task.create({
      title,
      description: description || "",
      project,
      assignedTo: assignedTo || req.user._id,
      status: status || "Pending",
      dueDate: dueDate || null,
    });

    const populated = await task.populate([
      { path: "project", select: "name" },
      { path: "assignedTo", select: "name email" },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Update task status (or full update for Admin)
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status, title, description, dueDate, assignedTo } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Members can only update status on tasks assigned to them
    if (req.user.role !== "Admin" && task.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }

    // Admins can update everything, Members only status
    if (req.user.role === "Admin") {
      task.title = title || task.title;
      task.description = description !== undefined ? description : task.description;
      task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
      task.assignedTo = assignedTo || task.assignedTo;
    }
    task.status = status || task.status;

    const updatedTask = await task.save();
    const populated = await updatedTask.populate([
      { path: "project", select: "name" },
      { path: "assignedTo", select: "name email" },
    ]);

    res.status(200).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    await task.deleteOne();
    res.status(200).json({ id: req.params.id, message: "Task deleted" });
  } catch (error) {
    next(error);
  }
};
