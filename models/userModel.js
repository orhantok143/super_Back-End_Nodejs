import mongoose from "mongoose";
import argon2 from "argon2"

const userModel = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: {
        type: String,
        default: "logo.png"
    },
    role: { type: String, enum: ['User', 'Admin', 'SuperAdmin'], default: 'User' },
    business: { type: Object },
    rating: [{ type: Object, ref: "Review" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likePost: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    myFavorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }]


});

userModel.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        this.password = await argon2.hash(this.password);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare password
userModel.methods.isMatch = async function (password) {
    try {
        return await argon2.verify(this.password, password);
    } catch (err) {
        return false;
    }
};


const User = mongoose.model('User', userModel);
export default User



