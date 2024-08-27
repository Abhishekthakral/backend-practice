import {v2 as cloudinary} from 'cloudinary'

import fs from 'fs'

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.API_KEY,
    api_secret:process.env.API_SECRET,
});

const uploadOnCloudinary=async(localFilePath)=>{
    try{
        if(!localFilePath) return null
        //upload file on cloudinary
        const response= await cloudinary.uploader.upload(
            localFilePath, {
                resource_type:"auto"
            }
        )
        //file uploaded success
        console.log("file is uploaded",response.url);
        return response;
    }catch(error){
        fs.unlinkSync(localFilePath)//remove the locally saved temporary
        return null;
    }
}


export {uploadOnCloudinary};


