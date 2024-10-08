import express from "express";
import dotenv from "dotenv";
import { Routers } from "./routers/indexRouter.js";
import connectdDB from "./database/dbConnection.js";
import errorHandler from "./middlewares/errorHandler.js";
import morgan from "morgan";
import cors from "cors";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database Connection
connectdDB();

// Middleware
app.use(cors({
    origin: ["https://cafe-life.netlify.app", "http://localhost:3000"]
}));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Main Routes
app.use("/api/v2/user", Routers.userRoute);
app.use("/api/v2/admin", Routers.adminRoute);
app.use("/api/v2/product", Routers.productRoute);
app.use("/api/v2/category", Routers.categoryRoute);

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to Cafe Life API"
    });
});

// Error Handler Middleware
app.use(errorHandler);

// HTTPS sunucusunu dinle
app.listen(PORT, () => {
    console.log(`Sunucusu ${PORT} portunda çalışıyor.`);
});
