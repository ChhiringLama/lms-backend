import express from "express";
import upload from "../utils/multer.js";
import { uploadMediaCD, uploadPdfCD } from "../utils/cloudinary.js";

const router = express.Router();

router.route("/upload-video").post(upload.single("file"), async (req, res) => {
  try {
    const result = await uploadMediaCD(req.file.path);
    res.status(200).json({
      message: "File uploaded successfully",
      data: result,
      success:true
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error uploading file" });
  }
});

router.route("/upload-pdf").post(upload.single("file"), async (req, res) => {
  try {
    const result = await uploadPdfCD(req.file.path);
    res.status(200).json({
      message: "File uploaded successfully",
      data: result,
      success:true
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error uploading file" });
  }
});

export default router;