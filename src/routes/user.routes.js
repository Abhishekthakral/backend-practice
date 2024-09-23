import { Router } from "express";
import { loggedOutUser, loginUser, registerUser ,refreshAccesstoken,changeCurrentPassword,getCurrentUser,updateUserAvtar,updateUserCoverImage,getUserChannelProfile,getWatchHistory,updateAcceountDetail} from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js"
import {verifyjwt} from "../middlewares/auth.middleware.js"

const userrouter=Router();

userrouter.route('/register').post(
    upload.fields([
        {
            name:"avtar",
            maxCount:1,
        },
        {
            name:"coverImage",
            maxCount:1,
        }
    ]),
    registerUser);
userrouter.route('/login').post(loginUser)

userrouter.route("/logout").post(verifyjwt,loggedOutUser)

userrouter.route("/refresh-token").post(refreshAccesstoken);

userrouter.route("/changePassword").post(verifyjwt,changeCurrentPassword);

userrouter.route("/currentuser").get(verifyjwt,getCurrentUser);

userrouter.route("/update_account").patch(verifyjwt,updateAcceountDetail);

userrouter.route("/avatar").patch(verifyjwt,upload.single("avtar"),updateUserAvtar);

userrouter.route("/coverimage").patch(verifyjwt,upload.single("coverimage"),updateUserCoverImage);

userrouter.route("/channelProfile").get(verifyjwt,getUserChannelProfile);

userrouter.route("watch-history").get(verifyjwt,getWatchHistory)
export default userrouter