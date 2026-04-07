import express from "express";
import { getLecturers, sendInstructorCode } from "../controllers/miscellaneousController.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
const router = express.Router();

router.route("/get-lecturers").get(getLecturers);
router.route("/send-instructor-code").post(sendInstructorCode);


export default router;
