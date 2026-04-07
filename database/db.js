import mongoose from "mongoose";

// Connect to Cloud
/**
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connection to Cloud Database Successfull");
  } catch (err) {
    console.log("Error occured" + err);
  }
};
 */

//Connect to local db
const connectDB = () => {
  var db = "mongodb://localhost:27017/lms";
  mongoose.connect(db);

  const conSuccess = mongoose.connection;
  conSuccess.once("open", (_) => {
    console.log("Database connected:", db);
  });
};

export default connectDB;
