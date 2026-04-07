import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config({});

cloudinary.config({
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  cloud_name: process.env.CLOUD_NAME,
});

export const uploadMediaCD = async (file) => {
  try {
    const uploadRes = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
    });
    return uploadRes;
  } catch (err) {
    console.log(err);
  }
};

export const uploadPdfCD = async (file) => {
  try {
    const uploadRes = await cloudinary.uploader.upload(file, {
      resource_type: "raw",
      format: "pdf",
    });
    return uploadRes;
  } catch (err) {
    console.log(err);
  }
};



export const deleteMediaCD = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.log(err);
  }
};

export const deleteVideoCD = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
  } catch (err) {
    console.log(err);
  }
};
