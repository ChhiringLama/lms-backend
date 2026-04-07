import { Course } from "../models/courseModel.js";
import { User } from "../models/userModel.js";
import { Lecture } from "../models/lectureModel.js";
import {
  deleteMediaCD,
  deleteVideoCD,
  uploadMediaCD,
} from "../utils/cloudinary.js";
import { getRecommendedCourses } from "../utils/recoalgo.js";

export const createCourse = async (req, res) => {
  try {
    const { courseTitle, category, coursePrice } = req.body;

   
    if (!courseTitle || !category || !coursePrice) {
      return res.status(400).json({
        message: "Course title , price and category are required.",
      });
    }
    //Req.id is sent thru the same isAuthenticated middleware, not ot forget  once user loggs in every reques has access to req.id
    const course = await Course.create({
      courseTitle,
      category,
      coursePrice,
      creator: req.id,
    });
    return res.status(200).json({
      success: true,
      message: "Course successfully created",
      course,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to create course",
      err,
    });
  }
};

export const getCreatorCourses = async (req, res) => {
  try {
    const userId = req.id;
    //Courses published by the current user
    const courses = await Course.find({ creator: userId });
    if (!courses) {
      return res.status(404).json({
        courses: [],
        message: "Courses not found",
      });
    }

    return res.status(200).json({
      courses,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to create course",
    });
  }
};

export const removeCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    console.log("Course to be removed is " + courseId);

    const retrivedCrouse = await Course.findById(courseId);
    console.log(retrivedCrouse);

    // Associated lectures
    const lecturesOfRetrivedCourse = await Lecture.find({
      _id: { $in: retrivedCrouse.lectures },
    });

    if (lecturesOfRetrivedCourse) {
      console.log(
        "Lectures of the course retrived, Moving to deletion of videos"
      );

      for (const lecture of lecturesOfRetrivedCourse) {
        await deleteVideoCD(lecture.publicId); // Assuming deleteVideoCD is your Cloudinary helper function
        if (lecture.publicId) {
          await deleteVideoCD(lecture.publicId); // Delete video
        }
        if (lecture.pdfPublicId) {
          await deleteMediaCD(lecture.pdfPublicId); // Delete PDF
        }
      }

      await Lecture.deleteMany({ _id: { $in: retrivedCrouse.lectures } });
      await Course.findByIdAndDelete(courseId);
      return res.status(200).json({
        message: "Course removed successfully",
      });
    } else {
      console.log(
        "No Lectures found on the retrived course, Moving to delete the course"
      );
      await Course.findByIdAndDelete(courseId);
    }
  } catch (error) {
    res.status(400).json({
      message: "Course deletion failed",
    });
  }
};

export const editCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const {
      courseTitle,
      subTitle,
      expectedOutcome,
      description,
      category,
      courseLevel,
      coursePrice,
    } = req.body;
    const courseThumbnail = req.file; // File from the request



    let course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found!",
      });
    }

    let uploadedThumbnail; // Variable to store uploaded thumbnail URL
    let uploadedThumbnailPublicId;

    if (courseThumbnail) {
      // Delete old thumbnail if it exists
      if (course.courseThumbnailPublicId) {
        await deleteMediaCD(course.courseThumbnailPublicId);
      }

      // Upload new thumbnail
      const cloudinaryResponse = await uploadMediaCD(courseThumbnail.path);
      uploadedThumbnail = cloudinaryResponse.secure_url;
      uploadedThumbnailPublicId = cloudinaryResponse.public_id;
    }

    // Prepare updated data
    const updatedData = {
      courseTitle,
      subTitle,
      description,
      category,
      courseLevel,
      expectedOutcome,
      coursePrice,
      courseThumbnail: uploadedThumbnail || course.courseThumbnail,
      courseThumbnailPublicId:
        uploadedThumbnailPublicId || course.courseThumbnailPublicId,
    };

    // Update course in the database
    course = await Course.findByIdAndUpdate(courseId, updatedData, {
      new: true,
    });



    return res.status(200).json({
      course,
      message: "Course updated successfully.",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Failed to update course",
    });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found!",
      });
    }
    return res.status(200).json({
      course,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to get course",
    });
  }
};

export const createLecture = async (req, res) => {
  try {
    const { lectureTitle } = req.body;
    console.log(req.body);
    const { courseId } = req.params;
    console.log(courseId);

    if (!lectureTitle || !courseId) {
      return res.status(400).json({
        message: "Lecture title is required",
      });
    }

    const lecture = await Lecture.create({ lectureTitle });

    const course = await Course.findById(courseId);
    if (course) {
      course.lectures.push(lecture._id);
      await course.save();
    }

    return res.status(201).json({
      lecture,
      message: "Lecture created successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to create lecture",
    });
  }
};

export const getCourseLecture = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate("lectures");
    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }
    return res.status(200).json({
      lectures: course.lectures,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get course lectures",
    });
  }
};

export const editLecture = async (req, res) => {
  try {
    const { lectureTitle, videoInfo, isPreviewFree, lectureDesc, pdfInfo } =
      req.body;
    console.log("Response from edit lecture to check isPreviewFree");
    console.log(req.body);

    // videoInfo ma public id ra url cha
    const { courseId, lectureId } = req.params;

    //Find the lecture in the database
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found",
      });
    }

    //Delete the public and id if new video was submitted.
    if (videoInfo && lecture.publicId) {
      await deleteVideoCD(lecture.publicId);
    }
    //Delete the PDF if new PDF was submitted.
    if (pdfInfo && lecture.pdfPublicId) {
      await deleteMediaCD(lecture.pdfPublicId);
    }

    //Update lecture

    if (lectureTitle) lecture.lectureTitle = lectureTitle;

    if (lectureDesc) lecture.lectureDesc = lectureDesc;
    if (videoInfo) {
      lecture.videoUrl = videoInfo.videoUrl;
      lecture.publicId = videoInfo.publicId;
    }

    if (pdfInfo) {
      lecture.pdfUrl = pdfInfo.pdfUrl;
      lecture.pdfPublicId = pdfInfo.pdfPublicId;
    }
    // Always update isPreviewFree regardless of its value
    if (typeof isPreviewFree === "boolean") {
      lecture.isPreviewFree = isPreviewFree;
    }

    await lecture.save();

    //Ensure the course still has the lecture id if it was not already added
    const course = await Course.findById(courseId);

    if (course && course.lectures.includes(lectureId._id)) {
      course.lectures.push(lecture._id);
      await course.save();
    }

    return res.status(200).json({
      lecture,
      message: "Lecture updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get lectures",
      success: false,
    });
  }
};

export const removeLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const lecture = await Lecture.findByIdAndDelete(lectureId);
    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found!",
      });
    }

    //Delete the video of that lecture
    if (lecture.publicId) {
      await deleteVideoCD(lecture.publicId);
    }

    //Delete the PDF of that lecture
    if (lecture.pdfPublicId) {
      await deleteMediaCD(lecture.pdfPublicId);
    }

    //Remove the lecture reference from the related course
    //Searching lecture in lectures array, remove the lecture id form the array
    await Course.updateOne(
      { lectures: lectureId },
      { $pull: { lectures: lectureId } }
    );

    return res.status(200).json({
      message: "Lecture removed successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to remove lecture",
      success: false,
    });
  }
};

export const getLectureById = async (req, res) => {
  try {
    const { lectureId } = req.params;
   
    if (!lectureId) {
      return res.status(400).json({
        message: "Lecture Id is required!",
      });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({
        message: "Lecture not found!",
      });
    }

    return res.status(200).json({
      lecture,
    });
  } catch (error) {
   
    return res.status(500).json({
      message: "Failed to get lecture by id",
    });
  }
};

//Publishing course

export const togglePublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { publish } = req.query;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({
        message: "Course not found!",
      });
    }

    //Setting up published status

    course.isPublished = publish === "true";
    await course.save();

    const statusMessage = course.isPublished ? "Published" : "Unpublished";

    return res.status(200).json({
      message: `Course is ${statusMessage}`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to update status",
    });
  }
};

export const getPublishedCourse = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).populate({
      path: "creator",
      select: "name photoUrl",
    });
    if (!courses) {
      return res.status(404).json({
        message: "Courses not found",
      });
    }
    return res.status(200).json({
      courses,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get courses on home page",
    });
  }
};
export const searchCourse = async (req, res) => {
  try {
    let { q = "", categories = [], sortByPrice = "" } = req.query;

    if (typeof categories === "string" && categories.length > 0) {
      categories = categories.split(",").map((c) => c.trim());
    }

    // Create search criteria
    const searchCriteria = {
      isPublished: true,
      $or: [
        { courseTitle: { $regex: q, $options: "i" } },
        { subTitle: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ],
    };

    // Filter by categories if provided
    if (Array.isArray(categories) && categories.length > 0) {
      searchCriteria.category = { $in: categories };
    }

    // Define sort options
    const sortOptions = {};
    if (sortByPrice === "low-to-high") {
      sortOptions.coursePrice = 1; // Ascending order
    } else if (sortByPrice === "high-to-low") {
      sortOptions.coursePrice = -1; // Descending order
    }

    const courses = await Course.find(searchCriteria)
      .populate({ path: "creator", select: "name photoUrl" })
      .sort(sortOptions);

  

    return res.status(200).json({
      success: true,
      courses: courses || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while searching for courses.",
      error,
    });
  }
};

export const getEnrolledCourse = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user and populate the enrolledCourses field
    const user = await User.findById(userId).populate({
      path: "enrolledCourses",
      select: "courseTitle category coursePrice creator courseThumbnail _id", // Select specific fields from the Course model
      populate: {
        path: "creator",
        select: "name photoUrl", // Populate the creator field in the Course model
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      enrolledCourses: user.enrolledCourses || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while searching for courses.",
      error,
    });
  }
};

export const getSimilarCourses = async (req, res) => {
  try {
    const { courseId } = req.params;

    // const baseCourse=Course.findById(courseId);
    const resultarray = await getRecommendedCourses(courseId);


    res.status(200).json({
      message: "Successfull",
      resultarray
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occured while fetching similar courses",
      error,
    });
  }
};
