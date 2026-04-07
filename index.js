import express from "express";
import dotenv from "dotenv";
import connectDB from "./database/db.js";
import userRoute from './routes/userRoute.js'
import courseRoute from './routes/courseRoute.js'
import cookieParser from "cookie-parser";
import cors from 'cors'
import mediaRoute from './routes/mediaRoute.js'
import coursePurchaseRoute from "./routes/coursePurchaseRoute.js";
import courseProgressRoute from './routes/courseProgressRoute.js'
import reviewRoute from './routes/reviewRoute.js'
import miscellaneousRoute from './routes/miscellaneousRoutes.js'


dotenv.config({});
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

//Pre requisite middleware
app.use(express.json());
app.use(cookieParser())
app.use(cors({
  origin:'http://localhost:5173',
  credentials:true
}));


//APIS

app.use('/api/v1/user', userRoute);
app.use('/api/v1/course', courseRoute);
app.use('/api/v1/media', mediaRoute)
app.use("/api/v1/purchase", coursePurchaseRoute);
app.use("/api/v1/progress", courseProgressRoute);
app.use("/api/v1/review", reviewRoute);
app.use("/api/v1/miscellaneous", miscellaneousRoute)

app.listen(PORT, () => {
  console.log(`Server listening at port ${PORT}`);
});
