// import dotenv from 'dotenv'
import mongoose from 'mongoose';

import {DB_Name} from '../constants.js';

// dotenv.config({path:'./env'});

const connectionDB=async()=>{
    try{
       await  mongoose.connect(`${process.env.MONGO_URL}/${DB_Name}`);
        console.log("connection successful");
    }
    catch(error){
        console.log(`connection error`,error)
    }
}

export default connectionDB;
