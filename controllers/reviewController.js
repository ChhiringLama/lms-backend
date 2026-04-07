import { Course } from '../models/courseModel.js';
import { Review } from '../models/reviewsModel.js';
import { User } from '../models/userModel.js';

export const createReview = async (req, res) => {
    try {
        const { courseId, message: body, rating } = req.body;
        const author = req.id;
        const reviewBody = { author, body, rating }


        const course = await Course.findById(courseId)

        const newReview = new Review(reviewBody);
        course.reviews.push(newReview);

        await newReview.save();
        await course.save();


        return res.status(201).json({
            message: "Success"

        })

    } catch (error) {
        console.log(error)
        return res.status(400).json(
            {
                message: "An error occured",
                error
            }
        )
    }
}


export const getAllReview = async (req, res) => {
    try {
        const { courseId } = req.params;
        const foundReview = await Course.findById(courseId).select("reviews").populate({
            path: "reviews", select: "body rating author", populate: {
                path: "author",
                select: "name photoUrl" // fields from user
            }
        });


        if (!foundReview || !foundReview.reviews.length) {
            return res.status(204).json({
                message: "No reviews found",
            });
        }
        console.log(foundReview)
        return res.status(200).json({
            message: "Reviews found",
            foundReview,
        });

    } catch (error) {
        res.status(400).json({
            message: error || "An error occured while retrieving reviews"
        })
    }
}