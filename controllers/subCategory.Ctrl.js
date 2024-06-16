import { createError } from "../middlewares/errorHandler.js"
import { Category, subCategoryModel } from "../models/categoryModel.js"



class subCategoryController {
    static create = async (req, res, next) => {
        try {
            await subCategoryModel.create(req.body)
            res.status(201).send({ message: "Sub Category created successfully" })
        } catch (error) {
            next(createError(500, "Error creating sub category", error.message)
            )
        }
    }

    static delete = async (req, res, next) => {
        const { id } = req.params
        try {
            await subCategoryModel.findByIdAndDelete(id)
            res.status(200).json({
                message: "Alt kategori başarıyla silindi",
            })
        } catch (error) {
            next(createError(500, "Error deleting sub category", error.message))
        }
    }

    static update = async (req, res, next) => {
        const { id } = req.params;
        try {
            const { title } = req.body;
            const subCategory = await subCategoryModel.findById(id);
            const category = await Category.findOne({ subCategory });

            if (!subCategory) {
                return res.status(404).json({
                    message: "Sub category not found"
                });
            }

            if (!category) {
                return res.status(404).json({
                    message: "Category not found"
                });
            }

            const updatedSubCategory = await subCategoryModel.findByIdAndUpdate(id, { title }, { new: true });

            category.subCategory = category.subCategory.map(sub => sub._id.toString() === updatedSubCategory._id.toString() ? updatedSubCategory : sub);
            await category.save();

            res.status(200).json({
                message: "Alt kategori başarıyla güncellendi",
                updatedSubCategory,
            });
        } catch (error) {
            next(createError(500, "Error updating sub category", error));
        }
    };

    static get = async (req, res, next) => {
        const { id } = req.params
        try {
            const subCategories = await subCategoryModel.findById(id)
            res.status(200).json({
                message: "Alt kategori alındı",
                subCategories
            })
        } catch (error) {
            next(createError(500, "Alt kategori alırken hata çıktı", error.message))
        }
    }


    static getAll = async (req, res, next) => {
        console.log("getAll");
        try {
            const subCategories = await subCategoryModel.find()
            res.status(200).json({
                message: "Bütün Alt kategoriler alındı",
                subCategories
            })
        } catch (error) {
            next(createError(500, "Error getting all sub categories", error.message))
        }
    }
}




export default subCategoryController