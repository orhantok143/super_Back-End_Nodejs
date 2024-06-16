import express from "express"
import auth from "../middlewares/authMiddleware.js"
import authorize from "../middlewares/roleMiddleware.js"
import upload from "../middlewares/upload.js"
import CategoryController from "../controllers/categoryCtrl.js"
import subCategoryController from "../controllers/subCategory.Ctrl.js"



const cRouter = express.Router()

cRouter.post("/create", auth, authorize(["Admin", "SuperAdmin"]), upload.single("image"), CategoryController.create)
cRouter.route("/:id")
    .put(auth, authorize(["Admin", "SuperAdmin"]), CategoryController.update)
    .delete(auth, authorize(["Admin", "SuperAdmin"]), CategoryController.delete)
    .get(CategoryController.get)
cRouter.get("/", CategoryController.getAll)
cRouter.route("/subcategory/:id")
    .delete(auth, authorize(["Admin", "SuperAdmin"]), subCategoryController.delete)
    .put(auth, authorize(["Admin", "SuperAdmin"]), subCategoryController.update)
    .get(auth, authorize(["Admin", "SuperAdmin"]), subCategoryController.get)
cRouter.get("/sub/get-all", auth, authorize(["Admin", "SuperAdmin"]), subCategoryController.getAll)



export default cRouter