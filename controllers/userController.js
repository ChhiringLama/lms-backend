import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaCD, uploadMediaCD } from "../utils/cloudinary.js";

export const getActivity = async (req, res) => {
  try {
    const userId = req.id;
    const { activities } = await User.findById(userId).select("activities");

    if (!activities || activities.length <= 0) {
      return res.status(200).json({
        message: "No activity found",
      });
    }

    return res.status(200).json({
      activities,
    });
  } catch (error) {
    return res.status(400).json({
      message: error || "An error occured",
    });
  }
};

export const createActivity = async (req, res) => {
  try {
    const {
      action,
      actionDes = "No Description",
      relatedLesson = null,
      relatedCourse = null,
    } = req.body;
    const userId = req.id; // middleware sets this

    console.log(req.body);

    // push activity into user model
    await User.findByIdAndUpdate(userId, {
      $push: {
        activities: {
          $each: [
            {
              action,
              actionDes,
              relatedCourse: relatedCourse || null, // optional
              relatedLesson: relatedLesson || null, // match schema
              createdAt: new Date(),
            },
          ],
          $position: 0, // push at the beginning (optional)
          $slice: 5, // keep only the latest 5 items
        },
      },
    });
    return res.status(201).json({ message: "Activity logged successfully" });
  } catch (error) {
    return res.status(400).json({
      message: error || "An error occured",
    });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, forInstructor } = req.body;

    // Check for missing fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Input field is not properly filled.",
      });
    }

    // Email format validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }

    // Password length check
    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 4 characters long.",
      });
    }

    // Check if user already exists
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists with the given email.",
      });
    }

    // Determine user role based on forInstructor checkbox
    let role = "student"; // Default role
    if (forInstructor) {
      role = "instructor"; // Set to instructor directly
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: hashedPassword,
      role, // Add the role to the user creation
    });

    // Different success messages based on role
    const successMessage =
      role === "instructor"
        ? "Account created successfully as instructor."
        : "Account created successfully as student.";

    return res.status(201).json({
      success: true,
      message: successMessage,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to register",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Input field is not properly filled.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Email or Password",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Email or Password",
      });
    }

    generateToken(res, user, `Welcome back ${user.name}`);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to register",
    });
  }
};

export const logout = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out succesfull",
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to register",
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    //We saved req.id from isAthenticated middleware
    const userId = req.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "Profile not found",
        success: false,
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to register",
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { name, bio } = req.body;
    const profilePhoto = req.file;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Delete old image if exists
    if (user.photoUrl) {
      const publicID = user.photoUrl.split("/").pop().split(".")[0];
      await deleteMediaCD(publicID);
    }

    // Upload new photo if provided
    let photoUrl = user.photoUrl;
    if (profilePhoto) {
      const cloudRes = await uploadMediaCD(profilePhoto.path);
      photoUrl = cloudRes.secure_url;
    }

    const updatedData = { photoUrl };

    //check if name was changed
    if (name && name.trim() !== "") {
      updatedData.name = name.trim();
    }

    // Only update if bio is non-empty
    if (bio && bio.trim() !== "") {
      updatedData.bio = bio.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    }).select("-password");

    return res.status(200).json({
      success: true,
      message: "User updated",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

export const getAlarmStatus = async (req, res) => {
  try {
    const userId = req.id;

    const user = await User.findById(userId).select("activities");

    if (
      !user ||
      !Array.isArray(user.activities) ||
      user.activities.length === 0
    ) {
      return res
        .status(200)
        .json({ warning: false, message: "No activity yet" });
    }

    // Helper: parse legacy locale string like "Thu, Sep 11, 8:25 PM" → Date (assume current year)
    const monthMap = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const parseLegacyTimestamp = (str) => {
      if (typeof str !== "string") return null;
      const m = str.match(/^[A-Za-z]{3},\s+([A-Za-z]{3})\s+(\d{1,2})/);
      if (!m) return null;
      const monthAbbr = m[1];
      const day = parseInt(m[2], 10);
      const month = monthMap[monthAbbr];
      if (month == null || Number.isNaN(day)) return null;
      const now = new Date();
      let d = new Date(now.getFullYear(), month, day);
      // If this date is > 180 days in the future (e.g., Dec→Jan rollover), assume it was last year
      const diffDaysAhead = (d - now) / (1000 * 60 * 60 * 24);
      if (diffDaysAhead > 180) {
        d = new Date(now.getFullYear() - 1, month, day);
      }
      return d;
    };

    const normalizeDate = (act) => {
      if (!act) return null;
      // Prefer actual Date-like fields
      if (act.createdAt instanceof Date && !isNaN(act.createdAt.getTime()))
        return act.createdAt;
      if (act.timestamp instanceof Date && !isNaN(act.timestamp.getTime()))
        return act.timestamp;
      // Fallback: legacy string in `timestamp`
      const parsed = parseLegacyTimestamp(act.timestamp);
      return parsed;
    };

    // Find most recent "Started lecture" (case-insensitive) with a usable date
    const latest = user.activities
      .filter(
        (a) =>
          typeof a.action === "string" &&
          a.action.toLowerCase() === "started lecture",
      )
      .map((a) => ({ a, d: normalizeDate(a) }))
      .filter(({ d }) => d instanceof Date && !isNaN(d.getTime()))
      .sort((x, y) => y.d - x.d)[0];

    if (!latest) {
      return res
        .status(200)
        .json({ warning: true, message: "No 'Started lecture' action found" });
    }

    const lastLectureDate = latest.d;
    const now = new Date();
    const diffDays = Math.abs(now - lastLectureDate) / (1000 * 60 * 60 * 24);

    const warning = diffDays > 3;
    return res.status(200).json({
      warning,
      message: warning
        ? "Warning! You haven't started a lecture in the last 3 days!"
        : "No Warning Required",
      lastStartedAt: lastLectureDate,
      daysSince: Number(diffDays.toFixed(2)),
    });
  } catch (error) {
    console.error("Error in getAlarmStatus:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Alert Algorithm Failed",
    });
  }
};
