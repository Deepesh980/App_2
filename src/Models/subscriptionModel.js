import mongoose, {Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const subscriptionSchema = new mongoose.Schema(
    {
        subscriber:{
            type: mongoose.Schema.Types.ObjectId, //User Who is subscribing
            ref:"User"
        },
        channel:{
            type: mongoose.Schema.Types.ObjectId, // Channel Owner whom to user is Subscribing
            ref: "User"
        }

    },{timestamps: true})

export const Subscription = mongoose.model('Subscription', subscriptionSchema)


