import User from "../models/User.js";

// @desc    Get all users (for team page and task assignment)
// @route   GET /api/users
// @access  Private
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ name: 1 });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};
