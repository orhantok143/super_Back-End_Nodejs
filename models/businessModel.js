import mongoose from "mongoose";

const businessSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    logo: {
        type: String,
        default: "logo.png"
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Business = mongoose.model('Business', businessSchema);
export default Business