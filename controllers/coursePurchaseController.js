import Stripe from "stripe";
import { Course } from "../models/courseModel.js";
import { CoursePurchase } from "../models/coursePurchaseModel.js";
import { Lecture } from "../models/lectureModel.js";
import { User } from "../models/userModel.js";

const stripeSecretkey = process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(stripeSecretkey);

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found!" });

    const newPurchase = new CoursePurchase({
      courseId,
      userId,
      amount: course.coursePrice,
      status: "pending", // fixed typo
    });

    //Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "NPR",
            product_data: {
              name: course.courseTitle,
              images: [course.courseThumbnail],
            },
            unit_amount: course.coursePrice * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:5173/dashboard/course-progress/${courseId}`, // fixed url
      cancel_url: `http://localhost:5173/dashboard/course-progress/${courseId}`, // fixed url
      metadata: {
        courseId: courseId,
        userId: userId,
      },
      shipping_address_collection: {
        allowed_countries: ["NP"], // fixed typo
      },
    });

    if (!session.url) {
      return res
        .status(400)
        .json({ success: false, message: "Error while creating session" });
    }

    //Save the purchase record

    newPurchase.paymentId = session.id;
    await newPurchase.save();

    return res.status(200).json({
      success: true,
      url: session.url, // Return the stripe URL
    });
  } catch (error) {
    console.log(error);
  }
};

export const webhook = async (req, res) => {
  let event;
  try {
    const payloadString = JSON.stringify(req.body, null, 2);
    const secret = process.env.WEBHOOK_ENDPOINT_SECRET;

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret,
    });

    event = stripe.webhooks.constructEvent(payloadString, header, secret);
  } catch (error) {
    console.log("Webhook error", error.message);
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  //Handle the checkout session completed event

  if (event.type === "checkout.session.completed") {
    try {
      const session = event.data.object;

      const purchase = await CoursePurchase.findOne({
        paymentId: session.id,
      }).populate({ path: "courseId" });

      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }

      if (session.amount_total) {
        purchase.amount = session.amount_total / 100;
      }

      purchase.status = "completed";

      //Make all lectures visible by setting isPreviewFree to true

      if (purchase.courseId && purchase.courseId.lectures.length > 0) {
        await Lecture.updateMany(
          { _id: { $in: purchase.courseId.lectures } },
          { $set: { isPreviewFree: true } }
        );
      }

      await purchase.save();

      //Update users' enrolledCourses

      await User.findByIdAndUpdate(
        purchase.userId,
        { $addToSet: { enrolledCourses: purchase.courseId._id } }, //Add course id
        { new: true }
      );

      //Update course to add user Id to enrolledStudents
      await Course.findByIdAndUpdate(
        purchase.courseId._id,
        { $addToSet: { enrolledStudents: purchase.userId } },
        { new: true }
      );
    } catch (error) {
      console.log("Error handling event:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const getPurchaseState = async (req, res) => {
  try {
    const { courseId, userId } = req.body;

    const purchased = await CoursePurchase.findOne({ userId, courseId });
    console.log("Course status: " + purchased);

    return res.status(200).json({
      purchased: purchased ? true : false,
    });
  } catch (error) {
    console.log("Error handling event:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getCourseDetailWithPurchaseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;

    const userId = req.id;

    const course = await Course.findById(courseId)
      .populate({ path: "creator" })
      .populate({ path: "lectures" });

    const purchased = await CoursePurchase.findOne({ userId, courseId });

    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }

    return res.status(200).json({
      course,
      purchased: purchased ? true : false,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getAllPurchasedCourse = async (_, res) => {
  try {
    const purchasedCourse = await CoursePurchase.find({
      status: "completed",
    }).populate("courseId");

    if (!purchasedCourse) {
      return res.status(404).json({
        purchasedCourse: [],
      });
    }

    return res.status(200).json({
      purchasedCourse,
    });
  } catch (error) {
    console.log(error);
  }
};
export const getTotalSale = async (req, res) => {
  try {
    const userId = req.id;

    const coursesFromThisInstructor = await Course.find({
      creator: userId,
    }).select("_id");
    
    if (!coursesFromThisInstructor || coursesFromThisInstructor.length === 0) {
      return res.status(204).json({
        message: "No courses found on this user",
      });
    }

    const purchasedCourses = await CoursePurchase.find({
      courseId: { $in: coursesFromThisInstructor.map((c) => c._id) },
      status: 'completed' // Only count completed purchases
    });

    // Sum up all the amounts from the purchased courses
    const totalSales = purchasedCourses.reduce((sum, purchase) => sum + purchase.amount, 0);

    return res.status(200).json({
      totalSales,
    });
  } catch (error) {
    return res.status(400).json({ message: "An error occurred", error });
  }
};