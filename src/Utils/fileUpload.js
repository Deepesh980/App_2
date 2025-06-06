import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

(async function() {

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
    });
})();

const uploadOnCloudinary = async(filePath) => {
    try {
        if(!filePath) {
            throw new Error("File path is required for upload");
        }

        // Upload the file to Cloudinary
        const upload = await cloudinary.uploader.upload(filePath, {resource_type: "auto"})
        //console.log("File uploaded Succesfully");
        fs.unlinkSync(filePath);  // Delete the file from local storage after upload
        return upload;
        
    } catch (error) {
        fs.unlinkSync(filePath); // Delete the file from local storage
        console.log("Error uploading file to Cloudinary:", error);
        throw error;
    }
}

export { uploadOnCloudinary }