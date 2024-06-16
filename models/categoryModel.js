import mongoose from "mongoose";


const subCategorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    image: { type: Object, default: null }
});

const categorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    subCategory: [subCategorySchema],
    image: {
        type: Object, default: null
    }
});

const subCategoryModel = mongoose.model("subCategoy", subCategorySchema)
const Category = mongoose.model('Category', categorySchema);
export { Category, subCategoryModel };