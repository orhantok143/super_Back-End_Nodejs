import express from "express"
import auth from "../middlewares/authMiddleware.js"
import authorize from "../middlewares/roleMiddleware.js"
import Admin from "../controllers/adminCtrl.js"
import AdminFirebase from "../controllers/firebase/adminCtrl.js"




const aRouter = express.Router()

aRouter.post("/register", auth, authorize(["SuperAdmin", "Admin"]), Admin.register)
aRouter.route("/:id")
    .put(auth, authorize(["Admin", "SuperAdmin"]), Admin.update)
    .delete(auth, authorize(["Admin", "SuperAdmin"]), Admin.delete)
    .get(auth, authorize(["Admin", "SuperAdmin"]), Admin.get)
aRouter.get("/", Admin.getAll)
aRouter.post("/login", Admin.login)
aRouter.post("/loginwithgoogle", AdminFirebase.loginWithGoogle)
aRouter.post("/checktoken", auth, Admin.checkToken)


export default aRouter