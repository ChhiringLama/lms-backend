import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  courseTitle: {
    type: String,
    required: true,
  },
  subTitle: {
    type: String,
  },
  description: {
    type: String,
  },
  category: {
    type: String,

  },
  courseLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
  },
  coursePrice: {
    type: Number,
    required: true,
  },
  courseThumbnail: {
    type: String,
  },
  courseThumbnailPublicId: {
    type: String,
  },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  lectures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecture" }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
 
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  isPublished: {
    type: Boolean,
    default: false
  },
  expectedOutcome: {
    type: String,
  }
}, { timestamps: true });

export const Course = mongoose.model("Course", courseSchema);
