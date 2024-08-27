import dotenv from 'dotenv'
import connectionDB from './DB/index.js';
import {app} from './app.js'

dotenv.config({path:'./.env'});


connectionDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log("server is running ");
    })
})
.catch((err)=>{
    console.log("error occured",err);
})






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