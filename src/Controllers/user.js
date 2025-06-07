import {asyncHandler} from '../Utils/asyncHandler.js';
import {apiError} from '../Utils/apiError.js';
import {User} from '../Models/userModel.js';
import {uploadOnCloudinary} from '../Utils/fileUpload.js';
import { apiResponse } from '../Utils/apiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return { accessToken, refreshToken }

    } catch (error) {
        throw new apiError(500, "Error generating access and refresh token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //Logic to register user
    
    //Get User Details from frontend
    const {username, email, fullName, password} = req.body
    //validation for user details
    if(!username || !email || !fullName || !password){
        throw new apiError(400,"Required fields are missing")
    }
    // check if user already exists
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new apiError(409,"User exists Already with Entered Email or Username");
    }
    //check for images and avatar, avatar check required

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    if(!avatarLocalPath){
        throw new apiError(400,"Avatar is requires");
    }
    // upload image and avatar to cloudinary

    const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
    const coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);

    // Better Approach for file upload
    // let coverImageUpload;
    // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverImageUpload = req.files?.coverImage[0]?.path
    // }

    if(!avatarUpload || !coverImageUpload){
        throw new apiError(500,"Avatar/ Cover Image upload failed");
    }
    //create user object - create entry in DB

    const user = await User.create({
        fullName,
        avatar: avatarUpload.url,
        coverImage: coverImageUpload.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    //check for user creation || remove password and refresh token from response

    const userChecked = await User.findById(user._id).select("-password -refreshToken");
    if(!userChecked){
        throw new apiError(500,"User creation failed");
    }

    // return response
    return res.status(201).json(
        new apiResponse(201, userChecked, "User registered successfully")
    );
})

const userLogin = asyncHandler(async (req, res) => {
    //Logic to Login user

    const {email, password, username} = req.body;

    if((!email || !username) && !password){
        throw new apiError(400, "Required fields are missing");
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new apiError(404, "User not found with provided credentials");
    }

    const isPasswordValid = await user.isAuthneticated(password)
    if(!isPasswordValid){
        throw new apiError(401, "Invalid credentials");
    }

    const {refreshToken, accessToken} = await generateAccessAndRefreshToken(user._id)

    const userLoggedIn = await User.findById(user._id).select("-password -refreshToken")
    
    const cookieOptions = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new apiResponse(
        200,
         {
            user: userLoggedIn, accessToken, refreshToken
         },
        "User logged in successfully"));

})

const userLogout = asyncHandler(async (req, res) => {
    //Logic to logout user
   User.findByIdAndUpdate(
    req.user._id,
    {
        $unset: {refreshToken: 1}
    },
    {
        new:true,
    }
   )

   const cookieOptions = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new apiResponse(200, {}, "User logged out successfully"));
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if(!incomingRefreshToken){
            throw new apiError(401, "Unauthorized Access Token")
        }
    
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
        if(!user)
        {
            throw new apiError(401, "Invalid Refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new apiError(401, "Refresh Token is expired or used")
        }
    
        const cookieOptions = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(
            new apiResponse(200,{accessToken, refreshToken: newRefreshToken}, "Access Token Refreshed Successfully")
        )
    } catch (error) {
        throw new apiError(401, error?.message)
    }
})

const changeUserPassword = asyncHandler( async(req, res) => {
     const {oldPassword, newPassword} = req.body

     const user = await User.findById(req.user?._id)
     const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

     if(!isPasswordCorrect){
        throw new apiError(400, "Invalid Password")
     }

     user.password = newPassword
     await user.save({validateBeforeSave: false})

     return res.status(200).json(new apiResponse(200, {}, "Password changed Successfuly"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200, req.user, "Current user fetched successfully")
})

const changeAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {
           new: true 
        }).select("-password")

        return res.status(200).json(new apiResponse(200 , user, "Account Details Updated Successfully"))
})

const userAvatarUpdate = asyncHandler(async (req, res)=> {
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new apiError(400, "Avatar File Missing")
    }

    const avatarUpload = await uploadOnCloudinary(avatarLocalPath)
    if(!avatarUpload.url){
        throw new apiError(400, "Error Uploading Avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
             $set:{
                avatar: avatar.url
             }
        },
        {
            new:true
        }).select("-password")

        return res.status(200)
        .json( new apiResponse(200, user, "Avatar Uploaded Successfully"))

})

const userCoverImageUpdate = asyncHandler(async (req, res)=> {
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath.url){
        throw new apiError(400, "Cover Image File Missing")
    }

    const coverImageUpload = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImageUpload.url){
        throw new apiError(400, "Error Uploading Cover Image")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
             $set:{
                coverImage: coverImage.url
             }
        },
        {
            new:true
        }).select("-password")

        return res.status(200)
        .json(200, user, "Cover Image Uploaded Successfully")
})

export {registerUser, userLogin, userLogout, refreshAccessToken, changeUserPassword, changeAccountDetails, getCurrentUser, userAvatarUpdate, userCoverImageUpdate}