import mongoose from "mongoose";
import { DB_Name } from "../constant.js"; 

const connectDB = async () =>{
    try {
        const connectionPool = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_Name}`);
        console.log(`MongoDB Connected !! DB Host: ${connectionPool.connection.host}`)
    } 
    catch (error) {
        console.log("Error connecting to the database:", error);
        process.exit(1); // Exit Process with failure
    }    
}

export default connectDB;