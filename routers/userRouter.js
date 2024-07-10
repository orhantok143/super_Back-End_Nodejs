import express from "express"
import User from "../controllers/userCtrl.js"
import auth from "../middlewares/authMiddleware.js"
import authorize from "../middlewares/roleMiddleware.js"
import upload from "../middlewares/upload.js"
const uRouter = express.Router()




// , auth, authorize(["SuperAdmin"]), 
uRouter.route("/comment/subcomment/:commentId").post(auth, User.subComment)
uRouter.route("/comment/subcomment/:scommentId").put(auth, User.updateSubComment)
uRouter.route("/comment/subcomment/:scommentId").delete(auth, User.deleteSubComment)
uRouter.route("/comment/subcomment/like/:scommentId").post(auth, User.likeSubComment)

uRouter.route("/comment/post/:postId").post(auth, User.commentPost)

uRouter.route("/comment/like/:commentId").post(auth, User.likeComment)
uRouter.route("/comment/:commentId").delete(auth, User.deleteCommentPost)
uRouter.route("/comment/:commentId").put(auth, User.updateCommentPost)

uRouter.route("/delete-avatar/:id").delete(auth, User.deleteImage);
uRouter.route("/post/:_id").delete(auth, User.deletePost)
uRouter.route("/post/:_id").post(auth, User.likePost)
uRouter.route("/post/:_id").get(auth, User.getPost)
uRouter.route("/post/:_id").put(auth, User.updatePost)

uRouter.route("/comment").get(auth, User.getAllComment)

uRouter.route("/post").get(auth, User.getAllPost)
uRouter.route("/post").post(auth,upload.single("image"), User.createPost)
uRouter.route("/register").post(User.register)

uRouter.route("/:id").get(auth, authorize(["SuperAdmin"]), User.get)
uRouter.route("/:id").delete(auth, authorize(["SuperAdmin"]), User.delete)
uRouter.route("/:id").put(auth, authorize(["SuperAdmin"]), User.update)
uRouter.route("/").get(auth, User.getAll)



export default uRouter