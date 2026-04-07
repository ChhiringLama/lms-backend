import { User } from "../models/userModel.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: 'Gmail', // Use 'Gmail' instead of host/port (recommended)
  auth: {
    user: process.env.EMAIL_USER, // Your full Gmail address (e.g., "you@gmail.com")
    pass: process.env.EMAIL_PASS, // App password (if 2FA enabled)
  },
})
export const getLecturers = async (req, res) => {
  try {
    const topInstructors = await User.aggregate([
      // Match only instructors
      { $match: { role: "instructor" } },

      // Lookup courses created by this instructor
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "creator",
          as: "taughtCourses",
        },
      },

      // Unwind the courses array
      { $unwind: { path: "$taughtCourses", preserveNullAndEmptyArrays: true } },

      // Add enrolledStudentsCount with null check
      {
        $addFields: {
          enrolledStudentsCount: {
            $cond: {
              if: { $isArray: "$taughtCourses.enrolledStudents" },
              then: { $size: "$taughtCourses.enrolledStudents" },
              else: 0,
            },
          },
        },
      },

      // Group and calculate totals
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          email: { $first: "$email" },
          bio: { $first: "$bio" },
          photoUrl: { $first: "$photoUrl" },
          totalStudents: { $sum: "$enrolledStudentsCount" },
          courseCount: { $sum: 1 },
        },
      },

      // Sort by total students descending
      { $sort: { totalStudents: -1 } },

      // Limit results
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: topInstructors,
    });
  } catch (error) {
    console.error("Error fetching lecturers:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Send Email

export const sendInstructorCode = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("Code reached me");

    // Verify user exists and is pending
    const user = await User.findOne({ email, role: "pending" });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No pending instructor found with this email",
      });
    }

    // Send email with env code
    const mailOptions = {
      to: email,
      subject: "Your Instructor Verification Code",
      //   text: `Your verification code is: ${process.env.INSTRUCTOR_CODE}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Instructor Account Verification</h2>
          <p>Your verification code is:</p>
          <div style="background: #f3f4f6; padding: 10px; border-radius: 5px; 
              font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0;
              color: #1e40af;">
            ${process.env.INSTRUCTOR_CODE}
          </div>
      
          <p style="font-size: 12px; color: #6b7280;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Failed to send code",
    });
  }
};

// const verifyUser=async(req,res)=>{
//     const {}
// }
