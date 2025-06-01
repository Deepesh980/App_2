//require('dotenv').config();
import dotenv from 'dotenv';
import connectDB from './DB/DB.js';

dotenv.config({
    path: './.env'
});

connectDB();