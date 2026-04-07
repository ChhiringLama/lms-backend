import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  register,
  login,
  updateUserProfile,
  logout,
  getUserProfile,
  createActivity,
  getActivity,
  getAlarmStatus,
  verifyUser,
} from "../controllers/userController.js";
import upload from "../utils/multer.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/profile").get(isAuthenticated, getUserProfile);
router
  .route("/profile/update")
  .put(isAuthenticated, upload.single("profilePhoto"), updateUserProfile);

router.route("/create-activity").post(isAuthenticated, createActivity);
router.route("/get-activity").get(isAuthenticated, getActivity);

//Instructor code sending mechanism is in miscellenaous, but verifying is here since we'll use the token
router.route("/verify-user").post(isAuthenticated, verifyUser);


//Sending Alaram

router.route('/get-alarm-status').get(isAuthenticated, getAlarmStatus)

export default router;
