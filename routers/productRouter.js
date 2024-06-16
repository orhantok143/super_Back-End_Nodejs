import express from "express"
import auth from "../middlewares/authMiddleware.js"
import authorize from "../middlewares/roleMiddleware.js"
import Product from "../controllers/productCtrl.js"
import upload from "../middlewares/upload.js"
const pRouter = express.Router()

pRouter.post("/create", auth, authorize(["Admin", "SuperAdmin"]), upload.single("image"), Product.create)
pRouter.route("/:id")
    .put(auth, authorize(["Admin", "SuperAdmin"]), Product.update)
    .delete(auth, authorize(["Admin", "SuperAdmin"]), Product.delete)
    .get(Product.get)
pRouter.get("/", Product.getAll)
pRouter.post("/:id/rating", auth, Product.rating)
pRouter.post("/:id/likes", auth, Product.like)
pRouter.post("/:id/comment", auth, Product.comment)
pRouter.post("/:id/addtofavorites", auth, Product.addToFavorites)

export default pRouter