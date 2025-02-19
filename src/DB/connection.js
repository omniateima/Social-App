import mongoose from "mongoose";

const connectDB = async () => {
 try {
     await mongoose.connect(process.env.DB_URI, {
       serverSelectionTimeoutMS: 5000,
     });
     console.log("connected to DB successfully");
 } catch (error) {
  console.log("Failed to connect DB", error);
 }
};

export default connectDB