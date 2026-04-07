
import { Course } from "../models/courseModel.js";

export const getRecommendedCourses = async (currentCourseId) => {
  try {
    // Define courseLevel values for comparison
    const courseLevelValues = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
    };

    // Find the current course and its details
    const currentCourse = await Course.findById(currentCourseId).populate(
      "reviews"
    );

    if (!currentCourse) {
      throw new Error("Course not found");
    }

    const { courseLevel, category, coursePrice } = currentCourse;
    console.log(courseLevel, category, coursePrice);

    // Fetch all courses, excluding the current course
    const allCourses = await Course.find({
      isPublished: true, // Only pick published courses
      _id: { $ne: currentCourseId }, // Exclude the current course
    }).populate("reviews");

    // Define min and max for normalization
    const minLevel = 1; // beginner
    const maxLevel = 3; // advanced
    const maxPrice = Math.max(...allCourses.map((c) => c.coursePrice));
    const minPrice = Math.min(...allCourses.map((c) => c.coursePrice));

    // Add scores for each course based on difficulty, price, and category
    const coursesWithScores = allCourses.map((course) => {
      // Normalize courseLevel using min-max normalization
      const levelScore =
        (courseLevelValues[course.courseLevel] - minLevel) /
        (maxLevel - minLevel);

      // Normalize price using min-max normalization
      const priceScore = 1 - (course.coursePrice - minPrice) / (maxPrice - minPrice); // Lower price is better

      // Category match score (1 if the category matches, 0 otherwise)
      const categoryScore = course.category === category ? 1 : 0;

      // Calculate the weighted score for this course
      // Difficulty = 20%, Price = 30%, Category = 50%
      const score = 0.2 * levelScore + 0.3 * priceScore + 0.5 * categoryScore;

      return { course, score };
    });

    // Sort by score (highest first) and limit results to top 5 recommendations
    const sortedCourses = coursesWithScores
      .sort((a, b) => b.score - a.score) // Sort by weighted score in descending order
      .slice(0, 5) // Limit to top 5 recommendations
      .map((item) => item.course); // Return only the course objects

    return sortedCourses.slice(0,3);
  } catch (error) {
    console.error("Error in getRecommendedCourses:", error);
    throw error;
  }
};