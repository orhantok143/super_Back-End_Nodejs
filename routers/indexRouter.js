import aRouter from "./adminRouter.js";
import cRouter from "./categoryRouter.js";
import pRouter from "./productRouter.js";
import uRouter from "./userRouter.js";

export const Routers = {
    adminRoute: aRouter,
    productRoute: pRouter,
    categoryRoute: cRouter,
    userRoute: uRouter
}