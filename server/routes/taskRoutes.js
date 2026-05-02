import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { getTasks, createTask, updateTaskStatus, deleteTask } from "../controllers/taskController.js";

const router = express.Router();

router.route("/")
  .get(protect, getTasks)
  .post(protect, admin, createTask);

router.route("/:id")
  .put(protect, updateTaskStatus)
  .delete(protect, admin, deleteTask);

export default router;
