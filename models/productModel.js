import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    date: { type: Date, default: Date.now }
});

const Review = mongoose.model("Review", reviewSchema)


const priceHistorySchema = new mongoose.Schema({
    price: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }
});

const priceHistory = mongoose.model("priceHistory", priceHistorySchema)



const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    priceHistory: [priceHistorySchema],
    stock: { type: Number, min: 0 },
    category: { type: String },
    subCategory: { type: String },
    images: [{ type: Object }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    reviews: [reviewSchema],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    isActive: { type: Boolean, default: true },
    activeHours: [{ type: Number, default: [0, 23] }], // [startHour, endHour] formatında
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: Object }],
    addToFavotiresUser: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    time: {
        type: Number
    }
}, {
    timestamps: true
});

// Ortalama değerlendirme puanını hesaplama
productSchema.methods.calculateAverageRating = function () {
    if (this.reviews.length > 0) {
        const total = this.reviews.reduce((acc, review) => acc + review.rating, 0);
        this.averageRating = (total / this.reviews.length);
    } else {
        this.averageRating = 0;
    }
    return this.averageRating;
};

const Product = mongoose.model('Product', productSchema);
export { Product, Review, priceHistory };
