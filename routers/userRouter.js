import express from "express"
import User from "../controllers/userCtrl.js"
import auth from "../middlewares/authMiddleware.js"
import authorize from "../middlewares/roleMiddleware.js"
import userCtrl from "../controllers/firebase/userCtrl.js"
const uRouter = express.Router()




// , auth, authorize(["SuperAdmin"]), 
uRouter.post("/register", User.register)
uRouter.route("/:id")
    .put(auth, authorize(["SuperAdmin"]), User.update)
    .delete(auth, authorize(["SuperAdmin"]), User.delete)
    .get(auth, authorize(["SuperAdmin"]), User.get)
uRouter.get("/", auth, authorize(["SuperAdmin"]), User.getAll)
uRouter.delete("/delete-avatar/:id", auth, User.deleteImage);

export default uRouter