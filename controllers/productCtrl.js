import Business from '../models/businessModel.js';
import { Product, Review, priceHistory } from '../models/productModel.js'; // Product modelini içeri aktar
import User from '../models/userModel.js';
import { createError } from '../middlewares/errorHandler.js'; // errorHandler'dan createError fonksiyonunu import ediyoruz
import multer from 'multer';
import sharp from 'sharp';
import { uploadToCloudinary, deleteFromCloudinary } from '../database/cloudinary.config.js';
import { Category, subCategoryModel } from "../models/categoryModel.js"


const storage = multer.memoryStorage();
const upload = multer({ storage });

class ProductControllers {
    // Yeni bir ürün oluştur
    static create = async (req, res, next) => {
        try {
            const file = req.file;
            if (!file) {
                return next(createError(400, 'No file uploaded'));
            }


            console.log("product::", req.file);
            const resizedBuffer = await sharp(file.buffer)
                .resize({ fit: 'contain' })
                .toBuffer();

            const result = await uploadToCloudinary(resizedBuffer);


            const { name, price, category, subCategory, description } = req.body;
            const ownerId = req.user.id;
            const businessId = req.user.business;

            const user = await User.findById(ownerId);
            const business = await Business.findById(businessId);
            if (!user || !business) {
                return next(createError(404, 'Kullanıcı veya işletme bulunamadı'));
            }
            const findCategory = await Category.findOne({ title: category })
            const findsubCategory = await subCategoryModel.findOne({ title: subCategory })

            console.log("Category:", findCategory);
            console.log("sunCategory:", findsubCategory);
            if (!findCategory) {
                return next(createError(404, "Kategori bulunamadı"));
            }

            if (!findsubCategory) {
                return next(createError(404, "Alt kategori bulunamadı"));
            }
            const image = {
                url: result.secure_url,
                id: result.public_id
            };
            const findProduct = await Product.findOne({ name, business: businessId })
            if (findProduct) {
                return next(createError(400, 'Ürün zaten var, ya silin yada güncelleyin'));
            }
            const product = new Product({
                name,
                price,
                category: findCategory.title,
                subCategory: findsubCategory.title,
                owner: ownerId,
                business: businessId,
                images: image ? [image] : [],
                description
            });

            await product.save();
            res.status(201).json(product);
        } catch (error) {
            next(createError(500, 'Upload failed: ' + error.message));
        }
    }

    static update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { name, price } = req.body;
            const file = req.file;

            let image;
            const isProduct = await Product.findById(id)

            if (price) {
                const historyPrice = new priceHistory({
                    price,
                    id
                })
                await historyPrice.save();
                isProduct.priceHistory.push(historyPrice)
            }

            if (file) {
                await deleteFromCloudinary(isProduct.images[0]);
                const resizedBuffer = await sharp(file.buffer)
                    .resize(800, 800, { fit: 'contain' })
                    .toBuffer();
                const result = await uploadToCloudinary(resizedBuffer);
                image = {
                    url: result.secure_url,
                    id: result.public_id
                };
            }

            // Mevcut isProduct nesnesini req.body ile güncelle
            Object.assign(isProduct, req.body);

            // Görselleri güncelle
            if (image) {
                isProduct.images = [image];
            }


            if (!isProduct) {
                return next(createError(404, 'Product not found'));
            }

            try {
                const updatedProduct = await isProduct.save();
                res.status(200).json({
                    message: "Ürün başarıyla güncellendi",
                    updatedProduct,
                });
            } catch (error) {
                next(createError(500, "Error updating product", error));
            }
        } catch (error) {
            next(createError(500, 'Update failed: ' + error.message));
        }
    }

    static delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const product = await Product.findById(id);

            if (!product) {
                return next(createError(404, 'Product not found'));
            }

            for (const image of product.images) {
                await deleteFromCloudinary(image.id);
            }

            // await product.remove();
            await priceHistory.findOneAndDelete({ id: id })
            await product.deleteOne()
            res.status(200).json({ message: 'Product deleted successfully' });
        } catch (error) {
            next(createError(500, 'Delete failed: ' + error.message));
        }
    }

    // Belirli bir ürünü al
    static get = async (req, res, next) => {
        try {
            const { id } = req.params;
            const product = await Product.findById(id).populate('owner', 'name').populate('business', 'name');
            if (!product) {
                throw createError(404, 'Ürün bulunamadı');
            }

            // Ürünün isActive durumunu kontrol et
            product.isActive = this.#isProductActive(product);
            res.json(product);
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }

    // Tüm ürünleri al
    static getAll = async (req, res, next) => {
        try {

            const products = await Product.find().populate('owner', 'name').populate('business', 'name');
            const now = new Date();
            const productsWithStatus = products.map(product => {
                product.isActive = this.#isProductActive(product, now);
                return product;
            });
            res.json(productsWithStatus);
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }

    // Ürünün aktif olup olmadığını kontrol eden fonksiyon
    static #isProductActive = (product) => {
        if (!product.activeHours || product.activeHours.length !== 2) {
            return false;
        }
        const now = new Date();
        const startHour = product.activeHours[0];
        const endHour = product.activeHours[1];

        const start = new Date(now);
        start.setHours(startHour, 0, 0, 0);
        const end = new Date(now);
        end.setHours(endHour, 0, 0, 0);

        return now >= start && now <= end;
    }

    static rating = async (req, res, next) => {
        try {
            const productId = req.params.id;
            const { rating, comment } = req.body;
            const { id } = req.user

            // Ürünü veritabanından bul
            const product = await Product.findById(productId);
            const user = await User.findById(id)
            if (!product) {
                throw createError(404, 'Ürün bulunamadı');
            }

            // Kullanıcının daha önce rating verip vermediğini kontrol et
            const existingReview = product.reviews.find(review => review.user.equals(id));

            if (existingReview) {
                // Kullanıcı zaten bir rating vermişse, bunu güncelle
                existingReview.rating = rating;
                existingReview.comment = comment;
                await Review.findByIdAndUpdate(existingReview._id, existingReview, { new: true })

                // Kullanıcının rating dizisini güncelle
                const userRating = user.rating.find(rate => rate._id.equals(existingReview._id));
                if (userRating) {
                    userRating.rating = rating;
                    await user.save();
                }
            } else {
                // Kullanıcı daha önce rating vermemişse, yeni bir review oluştur
                const newReview = new Review({ user: id, rating, comment });
                await newReview.save();

                product.reviews.push(newReview);
                await product.save();

                user.rating.push(newReview);
                await user.save();
            }

            // Ortalama rating'i hesapla ve güncelle
            product.calculateAverageRating(productId);

            // Veritabanında güncellemeleri kaydet
            await product.save();

            // Başarılı yanıtı gönder
            res.status(200).json({ message: 'Rating başarıyla güncellendi', product });
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }

    // Fiyat geçmişini güncelle
    static updatePriceHistory = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { price } = req.body;
            const product = await Product.findById(id);
            if (!product) {
                throw createError(404, 'Ürün bulunamadı');
            }
            product.price = price;
            product.priceHistory.push({ price });
            await product.save();
            res.json(product);
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }

    // Ürünü beğen
    static like = async (req, res, next) => {
        try {
            const { id } = req.params;
            const product = await Product.findById(id);
            if (!product) {
                throw createError(404, 'Ürün bulunamadı');
            }
            product.likes.push(req.user.id)
            await product.save();

            const user = await User.findById(req.user.id);
            if (!user) {
                throw createError(404, 'Kullanıcı bulunamadı');
            }
            user.likes.push(id);
            await user.save();

            res.json({ product, user });
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }

    // Yorum yap
    static comment = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { comment } = req.body;
            const product = await Product.findById(id);
            if (!product) {
                throw createError(404, 'Ürün bulunamadı');
            }


            const comments = {
                comment,


            }
            const isProduct = product.comments.filter(comment => comment.id.toString() === req.user.id.toString() ? comment.comment = comment : null)
            if (!isProduct) {
                comments.id = req.user.id
                console.log("Product Comment::", isProduct);
                product.comments.push(comments);
                await product.save();
            }


            const user = await User.findById(req.user.id);
            if (!user) {
                throw createError(404, 'Kullanıcı bulunamadı');
            }

            comments.id = id
            console.log("user Comment::", comments);
            user.comments.push(comments);
            await user.save();

            res.json({ product, user });
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }

    // Puan ver
    static rate = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { rating } = req.body;
            const product = await Product.findById(id);
            if (!product) {
                throw createError(404, 'Ürün bulunamadı');
            }
            product.ratings.push(rating);
            await product.save();

            const user = await User.findById(req.body.userId);
            if (!user) {
                throw createError(404, 'Kullanıcı bulunamadı');
            }
            user.ratedProducts.push(id);
            await user.save();

            res.json({ product, user });
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }

    // Favorilere ekle
    static addToFavorites = async (req, res, next) => {
        try {
            const { id } = req.params;
            const product = await Product.findById(id);
            const user = await User.findById(req.user.id)
            if (!product) {
                throw createError(404, 'Ürün bulunamadı');
            }
            if (!user) {
                throw createError(404, 'Kullanıcı bulunamadı');
            }
            const isFavori = product.addToFavotiresUser?.includes(req.user.id)
            if (isFavori) {
                product.addToFavotiresUser.pull(req.user.id)
                user.myFavorites.pull(id)
                await product.save()
                await user.save()
            } else {
                product.addToFavotiresUser.push(req.user.id);
                user.myFavorites.push(product._id)
                await product.save();
                await user.save()
            }
            res.json({ product, user });
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }
}

export default ProductControllers;
