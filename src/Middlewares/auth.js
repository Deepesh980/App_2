import { asyncHandler } from "../Utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../Models/userModel.js";
import { apiError } from "../Utils/apiError.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if(!token){
            throw new apiError(401, "Access token is missing");
        }
    
        const verifyToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(verifyToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new apiError(404,"User not found");
        }
    
        req.user = user;
        next();

    } catch (error) {
        console.log("Error in JWT verification:", error);
        throw new apiError(401, "Unauthorized Access Token");
    }

})
