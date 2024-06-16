import {

    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    getDocs,
    arrayUnion,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { createError } from '../../middlewares/errorHandler.js'; // errorHandler'dan createError fonksiyonunu import ediyoruz
import multer from 'multer';
import sharp from 'sharp';
import { db, storage } from "../../database/firebase.config.js";

const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

class ProductControllers {
    static create = async (req, res, next) => {
        try {
            const file = req.file;

            if (!file) {
                return next(createError(400, 'No file uploaded'));
            }

            const resizedBuffer = await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside' })
                .toBuffer();

            const storageRef = ref(storage, `SuperAPI/Products/${Date.now()}_${file.originalname}`);
            await uploadBytes(storageRef, resizedBuffer);
            const url = await getDownloadURL(storageRef);
            console.log(url);



            const { name, price } = req.body;
            const ownerId = req.user.id;
            const businessId = req.user.business;

            const userDoc = await getDoc(doc(db, "users", ownerId));
            const businessDoc = await getDoc(doc(db, "businesses", businessId));
            if (!userDoc.exists() || !businessDoc.exists()) {
                return next(createError(404, 'Kullanıcı veya işletme bulunamadı'));
            }

            const newProductRef = doc(collection(db, "products"));
            const productData = {
                name,
                price,
                owner: ownerId,
                business: businessId,
                images: [{ url, id: storageRef.name }],
                createdAt: new Date(),
            };

            await setDoc(newProductRef, productData);

            res.status(201).json({ id: newProductRef.id, ...productData });
        } catch (error) {
            next(createError(500, 'Upload failed: ' + error.message));
        }
    };

    static update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { name, price } = req.body;
            const file = req.file;

            let image;
            if (file) {
                const resizedBuffer = await sharp(file.buffer)
                    .resize(800, 800, { fit: 'inside' })
                    .toBuffer();
                const storageRef = ref(storage, `SuperAPI/Products/${Date.now()}_${file.originalname}`);
                await uploadBytes(storageRef, resizedBuffer);
                const url = await getDownloadURL(storageRef);
                image = { url, id: storageRef.name };
            }

            const productRef = doc(db, "products", id);
            const updateData = { name, price, ...(image && { images: [image] }) };
            await updateDoc(productRef, updateData);

            const updatedProductDoc = await getDoc(productRef);
            if (!updatedProductDoc.exists()) {
                return next(createError(404, 'Product not found'));
            }

            res.status(200).json({ id: updatedProductDoc.id, ...updatedProductDoc.data() });
        } catch (error) {
            next(createError(500, 'Update failed: ' + error.message));
        }
    };

    static delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const productRef = doc(db, "products", id);
            const productDoc = await getDoc(productRef);

            if (!productDoc.exists()) {
                return next(createError(404, 'Product not found'));
            }

            const productData = productDoc.data();
            for (const image of productData.images) {
                const imageRef = ref(storage, image.id);
                await deleteObject(imageRef);
            }

            await deleteDoc(productRef);
            res.status(200).json({ message: 'Product deleted successfully' });
        } catch (error) {
            next(createError(500, 'Delete failed: ' + error.message));
        }
    };

    static get = async (req, res, next) => {
        try {
            const { id } = req.params;
            const productDoc = await getDoc(doc(db, "products", id));
            if (!productDoc.exists()) {
                throw createError(404, 'Ürün bulunamadı');
            }

            const product = productDoc.data();
            product.isActive = this.#isProductActive(product);
            res.json(product);
        } catch (error) {
            next(error);
        }
    };

    static getAll = async (req, res, next) => {
        try {
            const productsQuery = query(collection(db, "products"));
            const productsSnapshot = await getDocs(productsQuery);
            const now = new Date();
            const productsWithStatus = productsSnapshot.docs.map(doc => {
                const product = doc.data();
                product.isActive = this.#isProductActive(product, now);
                return { id: doc.id, ...product };
            });
            res.json(productsWithStatus);
        } catch (error) {
            next(error);
        }
    };

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
    };

    static rating = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { rating, comment } = req.body;

            const productRef = doc(db, "products", id);
            const productDoc = await getDoc(productRef);
            if (!productDoc.exists()) {
                throw createError(404, 'Ürün bulunamadı');
            }

            const productData = productDoc.data();
            const existingReviewIndex = productData.reviews.findIndex(review => review.user === req.user.id);

            if (existingReviewIndex > -1) {
                productData.reviews[existingReviewIndex].rating = rating;
                productData.reviews[existingReviewIndex].comment = comment;
            } else {
                const newReview = { user: req.user.id, rating, comment };
                productData.reviews.push(newReview);
            }

            await updateDoc(productRef, { reviews: productData.reviews });

            res.status(200).json({ message: 'Rating başarıyla güncellendi', product: productData });
        } catch (error) {
            next(error);
        }
    };

    static updatePriceHistory = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { price } = req.body;

            const productRef = doc(db, "products", id);
            const productDoc = await getDoc(productRef);
            if (!productDoc.exists()) {
                throw createError(404, 'Ürün bulunamadı');
            }

            const productData = productDoc.data();
            productData.price = price;
            productData.priceHistory.push({ price, date: new Date() });

            await updateDoc(productRef, { price: productData.price, priceHistory: productData.priceHistory });

            res.json(productData);
        } catch (error) {
            next(error);
        }
    };

    static like = async (req, res, next) => {
        try {
            const { id } = req.params;
            const productRef = doc(db, "products", id);
            const productDoc = await getDoc(productRef);
            if (!productDoc.exists()) {
                throw createError(404, 'Ürün bulunamadı');
            }

            await updateDoc(productRef, { likes: arrayUnion(req.user.id) });

            const userRef = doc(db, "users", req.user.id);
            await updateDoc(userRef, { likedProducts: arrayUnion(id) });

            res.json({ message: 'Product liked successfully' });
        } catch (error) {
            next(error);
        }
    };

    static comment = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { comment } = req.body;
            const productRef = doc(db, "products", id);
            const productDoc = await getDoc(productRef);
            if (!productDoc.exists()) {
                throw createError(404, 'Ürün bulunamadı');
            }

            await updateDoc(productRef, { comments: arrayUnion({ user: req.user.id, comment }) });

            const userRef = doc(db, "users", req.user.id);
            await updateDoc(userRef, { commentedProducts: arrayUnion(id) });

            res.json({ message: 'Comment added successfully' });
        } catch (error) {
            next(error);
        }
    };

    static rate = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { rating } = req.body;
            const productRef = doc(db, "products", id);
            const productDoc = await getDoc(productRef);
            if (!productDoc.exists()) {
                throw createError(404, 'Ürün bulunamadı');
            }

            await updateDoc(productRef, { ratings: arrayUnion({ user: req.user.id, rating }) });

            const userRef = doc(db, "users", req.user.id);
            await updateDoc(userRef, { ratedProducts: arrayUnion(id) });

            res.json({ message: 'Product rated successfully' });
        } catch (error) {
            next(error);
        }
    };

    static addToFavorites = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { userId } = req.body;
            const productRef = doc(db, "products", id);
            const productDoc = await getDoc(productRef);
            if (!productDoc.exists()) {
                throw createError(404, 'Ürün bulunamadı');
            }

            await updateDoc(productRef, { favorites: arrayUnion(userId) });

            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, { favoriteProducts: arrayUnion(id) });

            res.json({ message: 'Product added to favorites successfully' });
        } catch (error) {
            next(error);
        }
    };
}

export default ProductControllers;
