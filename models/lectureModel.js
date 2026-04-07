import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    lectureTitle: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String,
    },
    isPreviewFree:{
      type:Boolean
    },
    lectureDesc:{
      type:String,
    },
    publicId: { type: String },
    pdfUrl: {
      type: String,
    },
    pdfPublicId: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Lecture = mongoose.model("Lecture", lectureSchema);
