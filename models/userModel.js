import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Username is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
    },
    password: {
      type: String,
      required: [true, "Email is required"],
    },
    role: {
      type: String,
      enum: ["instructor", "student", "pending"],
      default: "student",
    },
    bio: {
      type: String,
      validate: {
        validator: function (v) {
          const wordCount = v?.trim().split(/\s+/).length;
          return wordCount <= 150;
        },
        message: "Bio must not exceed 150 words.",
      },
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    activities: [
      {
        action: { type: String, required: true },
        actionDes: { type: String },
        timestamp: {
          type: String,
          default: () =>
            new Date().toLocaleString("en-US", {
              weekday: "short", // Tue
              month: "short", // Sep
              day: "2-digit", // 02
              hour: "numeric", // 1–12
              minute: "2-digit",
              hour12: true,
            }),
        },
        relatedCourse: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          default: null,
        },
        relatedLesson: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lecture",
          default: null,
        },
      },
    ],
    photoUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
