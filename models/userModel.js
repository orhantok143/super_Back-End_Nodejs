import mongoose from "mongoose";
import bcrypt from "bcrypt"

const userModel = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    Image: {
        type: String,
        default: "logo.png"
    },
    role: { type: String, enum: ['User', 'Admin', 'SuperAdmin'], default: 'User' },
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
    rating: [{ type: Object, ref: "Review" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: Object }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    myFavorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }]


});

userModel.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});


// Method to compare password
userModel.methods.isMatch = async function (password) {
    return await bcrypt.compare(password, this.password);
};


const User = mongoose.model('User', userModel);
export default User



