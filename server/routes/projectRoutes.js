import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  getProjects, getProjectById, createProject, updateProject,
  deleteProject, addMember, removeMember,
} from "../controllers/projectController.js";

const router = express.Router();

router.route("/")
  .get(protect, getProjects)
  .post(protect, admin, createProject);

router.route("/:id")
  .get(protect, getProjectById)
  .put(protect, admin, updateProject)
  .delete(protect, admin, deleteProject);

router.route("/:id/members")
  .post(protect, admin, addMember);

router.route("/:id/members/:userId")
  .delete(protect, admin, removeMember);

export default router;
