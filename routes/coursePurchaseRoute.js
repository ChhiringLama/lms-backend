import express from "express";
import {
  createCheckoutSession,
  getAllPurchasedCourse,
  getCourseDetailWithPurchaseStatus,
  getPurchaseState,
  getTotalSale,
  webhook,
} from "../controllers/coursePurchaseController.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router
  .route("/webhook")
  .post(express.raw({ type: "application/json" }), webhook);
router
  .route("/checkout/create-checkout-session")
  .post(isAuthenticated, createCheckoutSession);

router
  .route("/course/:courseId/detail-with-status")
  .get(getCourseDetailWithPurchaseStatus);
router.route("/course/:courseId/purchase-status").post(getPurchaseState);
router.route("/").get(isAuthenticated, getAllPurchasedCourse);

router.route("/course/get-total-sales").get(isAuthenticated, getTotalSale);
export default router;
