import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { createReview, getAllReview } from "../controllers/reviewController.js";

const router = express.Router()

router.route('/create/:courseId').post(isAuthenticated, createReview)
router.route('/getallreviews/:courseId').get(getAllReview)

export default router;