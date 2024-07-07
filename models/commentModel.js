import mongoose from "mongoose";

const SubCommentSchema = new mongoose.Schema({
    commentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    likes: {
        type: [String], // Beğenen kullanıcıların ID'lerini saklar
        default: [],
    },

}, {
    timestamps: true
});

const subComment = mongoose.model("subComment", SubCommentSchema)



const CommentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    likes: {
        type: [String], // Beğenen kullanıcıların ID'lerini saklar
        default: [],
    },
    subComments: {
        type: [Object],
        default: [],
    },

}, {
    timestamps: true
});

const Comment = mongoose.model('Comment', CommentSchema);
export { Comment, subComment }