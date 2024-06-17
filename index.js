import express from "express"
import dotenv from "dotenv"
import { Routers } from "./routers/indexRouter.js"
import connectdDB from "./database/dbConnection.js"
import errorHandler from "./middlewares/errorHandler.js"
import morgan from "morgan"
import cors from "cors"
dotenv.config()


const app = express()
const PORT = process.env.PORT || 5000

// Database Connection
connectdDB()




// const whitelist = ['http://localhost:3000', 'http://192.168.16.105:3000', "https://cafe-life.netlify.app"]; // İzin verilen kök URL'lerin listesi

// const corsOptions = {
//     origin: function (origin, callback) {
//         if (whitelist.indexOf(origin) !== -1 || !origin) {
//             callback(null, true);
//         } else {
//             callback(new createError(500, 'Not allowed by CORS'));
//         }
//     },
//     credentials: true,
// };

// Middlewares
app.use(cors())
app.use(express.json({ limit: "100mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))




app.use("/api/v2/user", Routers.userRoute)
app.use("/api/v2/admin", Routers.adminRoute)
app.use("/api/v2/product", Routers.productRoute)
app.use("/api/v2/category", Routers.categoryRoute)







// Error Handler Middleware
app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
