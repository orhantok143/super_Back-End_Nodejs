// models/Post.js
import mongoose from "mongoose"

const PostSchema = new mongoose.Schema({
    content: {
        type: String,
        required: false,
    },
    author: {
        type: String,
        required: true,
    },
    media: [{
        type: Object
    }],
    mediaType: {
        type: String,
        enum: ['image', 'video'],
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId, // Beğenen kullanıcıların ID'lerini saklar
        ref: "User",
        default: []
    }]
},
    {
        timestamps: true
    });

const Post = mongoose.model('Post', PostSchema);
export default Post 