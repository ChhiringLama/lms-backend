import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { createCourse, createLecture, editCourse, editLecture, getCourseById, getCourseLecture, getCreatorCourses, getEnrolledCourse, getLectureById, getPublishedCourse, removeCourse, removeLecture, searchCourse, togglePublishCourse , getSimilarCourses } from "../controllers/courseController.js";
import upload from '../utils/multer.js'

const router = express.Router();

// Course CRUD 
router.route("/").post(isAuthenticated, createCourse);
router.route("/search").get(searchCourse);
router.route("/published-courses").get(getPublishedCourse);
router.route("/").get(isAuthenticated, getCreatorCourses);
router.route("/:courseId").put(isAuthenticated,upload.single("courseThumbnail"), editCourse)
router.route("/:courseId").get(isAuthenticated,  getCourseById)
router.route("/:courseId/lecture").post(isAuthenticated,  createLecture)
router.route("/:courseId/lecture").get(isAuthenticated,  getCourseLecture)
router.route("/:courseId").patch(isAuthenticated, togglePublishCourse)
router.route("/:courseId").delete(isAuthenticated, removeCourse)

//Lectures CRUD
router.route("/:courseId/lecture/:lectureId").put(isAuthenticated, editLecture);
router.route("/lecture/:lectureId").delete(isAuthenticated, removeLecture);
router.route("/lecture/:lectureId").get(isAuthenticated, getLectureById);


//Enrolled courses
router.route('/coursesEnrolled/:userId').get(isAuthenticated,getEnrolledCourse )

//Similar courses
router.route('/similar-courses/:courseId').get(getSimilarCourses)

export default router;
