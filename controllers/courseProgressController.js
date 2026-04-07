import { CourseProgress } from "../models/courseProgress.js";
import { Course } from "../models/courseModel.js";

export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    //Fetch user course progress

    let courseProgress = await CourseProgress
      .findOne({ courseId, userId })
      .populate("courseId");

    const courseDetails = await Course.findById(courseId).populate('lectures');

    if (!courseDetails) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    //Step-2 , If no progress found, return course details with an empty progress
    if (!courseProgress) {
      return res.status(200).json({
        data: {
          courseDetails,
          progress: [],
          completed: false,
        },
      });
    }

    //Step-3 Return the users course progress along with course details

    return res.status(200).json({
      data: {
        courseDetails,
        progress: courseProgress.lectureProgressSchema || [],
        completed: courseProgress.completed,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const updateLectureProgress = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const userId = req.id;

    console.log("Updating lecture progress:", { courseId, lectureId, userId });

    //fetch or create course progress
    let courseProgress = await CourseProgress.findOne({ courseId, userId });

    if (!courseProgress) {
      //Create a new progress
      courseProgress = new CourseProgress({
        userId,
        courseId,
        completed: false,
        lectureProgressSchema: [],
      });
    }

    //Find the lecture progress in the course progress
    if (!courseProgress.lectureProgressSchema) {
      courseProgress.lectureProgressSchema = [];
    }
    
    const lectureIndex = courseProgress.lectureProgressSchema.findIndex(
      (lecture) => lecture.lectureId === lectureId
    );

    if (lectureIndex !== -1) {
      //If lecture already exist, update its status
      courseProgress.lectureProgressSchema[lectureIndex].viewed = true;
    } else {
      //Add new lecture progress

      courseProgress.lectureProgressSchema.push({
        lectureId,
        viewed: true,
      });
    }

    //If all lecture is complete
    const lectureProgressLength = courseProgress.lectureProgressSchema.filter(
      (lectureProg) => lectureProg.viewed
    );
    const course = await Course.findById(courseId).populate('lectures');

    console.log("Course data:", {
      courseId,
      courseExists: !!course,
      lecturesCount: course?.lectures?.length || 0,
      completedLecturesCount: lectureProgressLength.length
    });

    // Check if course and lectures exist before comparing
    if (course && course.lectures && course.lectures.length === lectureProgressLength.length) {
      courseProgress.completed = true;
    }

    await courseProgress.save();
    
    // Send response back to client
    return res.status(200).json({
      success: true,
      message: "Lecture progress updated successfully",
      data: courseProgress
    });
  } catch (error) {
    console.log("Error in updateLectureProgress:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update lecture progress",
      error: error.message
    });
  }
};

export const markAsCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const courseProgress = await CourseProgress.findOne({ courseId, userId });
    if (!courseProgress) {
      return res.status(404).json({ message: "Course Progress not found." });
    }

    if (!courseProgress.lectureProgressSchema) {
      courseProgress.lectureProgressSchema = [];
    }

    courseProgress.lectureProgressSchema.map(
      (lectureProgress) => (lectureProgress.viewed = true)
    );
    courseProgress.completed = true;
    await courseProgress.save();
    return res.status(200).json({ message: "Course marked as completed." });
  } catch (error) {
    console.log("Error in markAsCompleted:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark course as completed",
      error: error.message
    });
  }
};

export const markAsInComplete = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const courseProgress = await CourseProgress.findOne({ courseId, userId });
    if (!courseProgress) {
      return res.status(404).json({ message: "Course Progress not found." });
    }

    if (!courseProgress.lectureProgressSchema) {
      courseProgress.lectureProgressSchema = [];
    }

    courseProgress.lectureProgressSchema.map(
      (lectureProgress) => (lectureProgress.viewed = false)
    );
    courseProgress.completed = false;
    await courseProgress.save();
    return res.status(200).json({ message: "Course marked as incompleted." });
  } catch (error) {
    console.log("Error in markAsInComplete:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark course as incomplete",
      error: error.message
    });
  }
};
