import { Category, subCategoryModel } from '../models/categoryModel.js';
import { createError } from '../middlewares/errorHandler.js';

class CategoryController {
    static create = async (req, res, next) => {
        try {
            const { title, subCategory } = req.body;
            const category = await Category.findOne({ title })
            const subcategory = await subCategoryModel.findOne({ title: subCategory })

            if (category) {
                if (subcategory) {

                    res.json({
                        message: "Bu kategori ve altkategory var zaten.",
                        data: {
                            Category: category,
                        }
                    })
                } else {
                    const subcategory = await subCategoryModel.create({ title: subCategory })
                    category.subCategory.push(subcategory)
                    await category.save()
                    res.json({
                        message: "Yeni alt kategori eklendi",
                        subcategory
                    })
                }
            } else {
                const newCategory = await Category.create({ title });
                const subcategory = await subCategoryModel.create({ title: subCategory })
                newCategory.subCategory.push(subcategory)
                await newCategory.save();
                res.status(201).json(newCategory);
            }
        } catch (error) {
            next(createError(500, 'Kategori oluşturulamadı: ' + error.message));
        }
    }

    static update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { title } = req.body;
            const updatedCategory = await Category.findById(id);
            updatedCategory.title = title
            await updatedCategory.save();

            if (!updatedCategory) {
                return next(createError(404, 'Güncellenecek kategori bulunamadı'));
            }
            res.status(200).json(updatedCategory);
        } catch (error) {
            next(createError(500, 'Kategori güncellenemedi: ' + error.message));
        }
    }

    static get = async (req, res, next) => {
        try {
            const categoryId = req.params.id;
            const category = await Category.findById(categoryId);
            if (!category) {
                return next(createError(404, 'Kategori bulunamadı'));
            }
            res.status(200).json(category);
        } catch (error) {
            next(createError(500, 'Kategori alınamadı: ' + error.message));
        }
    }

    static getAll = async (req, res, next) => {
        try {
            const categories = await Category.find();
            res.status(200).json(categories);
        } catch (error) {
            next(createError(500, 'Kategoriler alınamadı: ' + error.message));
        }
    }

    static delete = async (req, res, next) => {
        try {
            const categoryId = req.params.id;
            const deletedCategory = await Category.findByIdAndDelete(categoryId);
            deletedCategory.subCategory.map(async (sub) => await subCategoryModel.findByIdAndDelete(sub._id))
            if (!deletedCategory) {
                return next(createError(404, 'Silinecek kategori bulunamadı'));
            }
            res.status(200).json({ message: 'Kategori başarıyla silindi' });
        } catch (error) {
            next(createError(500, 'Kategori silinemedi: ' + error.message));
        }
    }

    // Diğer işlemler buraya eklenebilir
}

export default CategoryController;
