import dotenv from 'dotenv'
import connectionDB from './DB/index.js';

dotenv.config({path:'./env'});

import express from "express";

const app=express()


connectionDB();







// (async()=>{
//     try{
//       await  mongoose.connect(`${process.env.MONGO_URL}/${DB_Name}`);
//       app.on("error",(error)=>{
//         console.log("error: ",error);
//         throw error;
//       })

//       app.listen(process.env.PORT,()=>{
//         console.log("server running");
//       })
//     }catch(err){
//         console.error(err);
//         throw err;
//     }
// })()