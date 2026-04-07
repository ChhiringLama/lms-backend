import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Use MongoDB Atlas if MONGO_URI exists, else fallback to local
    const dbURI = process.env.MONGO_URI || "mongodb://localhost:27017/lms";

    await mongoose.connect(dbURI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log("Database connected:", dbURI);
  } catch (err) {
    console.error("Error connecting to DB:", err.message);
    process.exit(1); // stops server if DB fails
  }
};

export default connectDB;
