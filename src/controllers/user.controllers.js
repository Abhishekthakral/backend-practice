import {asyncHandler} from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken';

const genetrateaccessandrefershtokens=async(userid)=>{
    try{
        const user=await User.findById(userid)
        const accessToken =await user.generateAccessToken()
        const refershToken=await user.generateRefreshToken()

        user.refereshToken=refershToken
        await user.save({validateBeforeSave: false})

        return {accessToken,refershToken}

    }catch(error){
        throw new ApiError(500,"something went wrong in refersh token")
    }
}

// const generateAccessAndRefereshTokens = async(userId) =>{
//     try {
//         const user = await User.findById(userId)
//         const accessToken = await  user.generateAccessToken()
//         const refreshToken =await  user.generateRefreshToken()

//         user.refereshToken= refreshToken
//         await user.save({ validateBeforeSave: false })

//         return {accessToken, refreshToken}


//     } catch (error) {
//         throw new ApiError(500, "Something went wrong while generating referesh and access token")
//     }
// }
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

    const existeduser=await User.findOne({
        $or:[
            {userName},
            {email}
        ]
    });
    if(existeduser){
        throw new ApiError(409,"user already existed");
    }

    const avtarLocalPath=req.files?.avtar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length > 0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }

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

const loginUser =asyncHandler(async(req,res)=>{
    // req.body -> data 
    // username or email 
    //find the user 
    //password check
    //access and referesh token
    //send cookie
    //send res
    const {email,password,username}=req.body;
    if(!(username||email)){
        throw new ApiError(400,"username or password is required")
    }
    const user = await User.findOne({
        $or:[{email},{username}]
    })

    if(!user){
        throw new ApiError(401,"user doesnot exist");
    }
    const isPasswordvalid=await user.isPasswordCorrect(password)

    if(!isPasswordvalid){
        throw new ApiError(401,"invalid user credentials");
    }

   const {accessToken,refershToken}=await genetrateaccessandrefershtokens(user._id)


   const loggedinUser = await User.findById(user._id).select(" -password -refereshToken")

   const options={
    httpOnly:true,
    secure:true
   }

   return res
   .status(200)
   .cookie("accessToken",accessToken)
   .cookie('refershToken',refershToken,options)
   .json(
    new ApiResponse(200,
        {
            user:loggedinUser,accessToken,refershToken
        },
        "user Logged in successfully"
    )
   )
})

// const loginUser = asyncHandler(async (req, res) =>{
//     // req body -> data
//     // username or email
//     //find the user
//     //password check
//     //access and referesh token
//     //send cookie

//     const {email, username, password} = req.body;

//     if (!username && !email) {
//         throw new ApiError(400, "username or email is required")
//     }
    
//     // Here is an alternative of above code based on logic discussed in video:
//     // if (!(username || email)) {
//     //     throw new ApiError(400, "username or email is required")
        
//     // }

//     const user = await User.findOne({
//         $or: [{username}, {email}]
//     })

//     if (!user) {
//         throw new ApiError(404, "User does not exist")
//     }

//    const isPasswordValid = await user.isPasswordCorrect(password)

//    if (!isPasswordValid) {
//     throw new ApiError(401, "Invalid user credentials")
//     }

//    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

//     const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

//     const options = {
//         httpOnly: true,
//         secure: true
//     }

//     return res
//     .status(200)
//     .cookie("accessToken", accessToken, options)
//     .cookie("refreshToken", refreshToken, options)
//     .json(
//         new ApiResponse(
//             200, 
//             {
//                 user: loggedInUser, accessToken, refreshToken
//             },
//             "User logged In Successfully"
//         )
//     )

// })

const loggedOutUser= asyncHandler(async(req,res)=>{
    //remove cookie
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refereshToken: 1
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
       }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie('refershToken',options)
    .json(
        new ApiResponse(200,{},"userloggedout succesfully")
    )
})

const refreshAccesstoken=asyncHandler(async(req,res)=>{
    const incomingrefreshToken=req.cookies.refershToken || req.body.refershToken

    if(!incomingrefreshToken){
        throw new ApiError(401,"unauthorized request");

    }

   try {
     const decodedToken=jwt.verify(incomingrefreshToken,REFRESH_TOKEN_SECRET)
 
     const user=await User.findById(decodedToken?._id)
 
     if(!user){
         throw new ApiError(401,"invalid refresh token");
 
     }
 
     if(incomingrefreshToken != user?.refereshToken){
         throw new ApiError(401,"refresh token expired");
     }
 
     const options={
         httpOnly:true,
         secure:true
     }
 
     const {accessToken,newrefershToken}=await genetrateaccessandrefershtokens(user._id)
 
     return res.status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newrefershTokenrefershToken,options)
     .json(
         new ApiResponse(200,
             {
                 accessToken,refereshToken: newrefershToken
             },"accesstoken generated again"
         ))
   } catch (error) {
    throw new ApiError(401,error?.message||"invalid refreshtoken");
   }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldpassword,newpassword}=req.body

    const user=await User.findById(reg.user?._id)

    const checkPassword=await user.isPasswordCorrect(oldpassword)

    if(!checkPassword){
        throw new ApiError(401,"password is incorrect")

    }

    user.password=newpassword;
    await  user.save({validateBeforeSave:true});

    res.status(200
        .json(new ApiResponse(
            201,
            {newpassword},
            "password changed successfully"
        ))
    )
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200,req.user,"current user accessed successfull"))
})

const updateAcceountDetail=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body
    if(!(fullName||email)){
        throw new ApiError(401,"user credentials is required")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
    ).select("-passsword")

    return res.status(200)
    .json(new ApiResponse(200,user,  "accounts details updated successfully"));
})

const updateUserAvtar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(401,"avatar is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(401,"failed to upload on cloudinary")
    }

    const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avtar : avatar.url
            }
        },
        {
            new:true
        }
    )

    return res.status(200)
    .json(new ApiResponse(200,user,"avatar image updated successfully"))
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(401,"cover image is required")
    }

    const coverimage=await uploadOnCloudinary(coverImageLocalPath)
    if(!coverimage.url){
        throw new ApiError(400,"failed to upload cover image")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverimage.url
            }
        },
        {new:true}
    )

    return res.status(200)
    .json(new ApiResponse(200,user,"cover image updated successfully"))
})

export {registerUser,loginUser,loggedOutUser,refreshAccesstoken,getCurrentUser,changeCurrentPassword,updateAcceountDetail,updateUserAvtar,updateUserCoverImage};