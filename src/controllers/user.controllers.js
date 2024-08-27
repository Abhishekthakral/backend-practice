import {asyncHandler} from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'


const registerUser=asyncHandler(async(req,res)=>{
    //get user details 
    //validation-not empty
    //check if user already exist:username ,email
    //check for images :check for avtar
    //upload them to cloudnary,avtar
    //create user object-create entry in db
    //remove pass and referesh token field from response
    //check for user creation
    //return res

    const {userName,fullName,email,password}=req.body
    if(
        [fullName,email,userName,password].some((field)=>{
            field?.trim()===""
        })
    ){
        throw new ApiError(400,"all fields are required");
    }

    const existeduser= User.findOne({
        $or:[
            {userName},
            {email}
        ]
    });
    if(existeduser){
        throw new ApiError(409,"user already existed");
    }

    const avtarLocalPath=req.files?.avtar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avtarLocalPath){
        throw new ApiError(409,"avtar is required")
    }

    const avtarCloud=await uploadOnCloudinary(avtarLocalPath);
    const coverImagecloud=await uploadOnCloudinary(coverImageLocalPath);

    if(!avtarCloud){
        throw new ApiError(409,"avtar up fail");
    }

   const user=await User.create({
        fullName,
        avtar:avtarCloud.url,
        coverImage:coverImagecloud.url || "",
        email,
        password,
        userName:userName.toLowerCase()
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refereshToken"
    )
    
    if(!createdUser){
        throw new ApiError(404,"user not found");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully")
    )
})



export {registerUser};