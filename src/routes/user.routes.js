import { Router } from "express";
import { loggedOutUser, loginUser, registerUser } from "../controllers/user.controllers.js";
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

export default userrouter