//require('dotenv').config();
import dotenv from 'dotenv';
import connectDB from './DB/DB.js';
import {app} from './app.js';

dotenv.config({
    path: './.env'
});

connectDB()
.then(() => {
    app.listen(process.env.PORT || 4000 , () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log("MongoDB Connection Failed",error)
})