import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a project name"],
      trim: true,
      maxlength: [150, "Name cannot be more than 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Project must have a creator"],
    },
    members: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["On Track", "At Risk", "Delayed", "Completed", "Planning"],
      default: "Planning",
    },
    startDate: { type: Date },
    endDate: { type: Date },
    // Activity log embedded
    activity: [
      {
        action: String,
        user: { type: mongoose.Schema.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;
