import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { createError } from '../../middlewares/errorHandler.js';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage, db } from '../../database/firebase.config.js';
import sharp from 'sharp';

class CategoryController {
    static create = async (req, res, next) => {
        try {
            const { title, subCategory } = req.body;

            const file = req.file

            if (!file) {
                return next(createError(400, 'No file uploaded'));
            }

            const resizedBuffer = await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside' })
                .toBuffer();


            const storageRef = ref(storage, `SuperAPI/Categories/${Date.now()}_${file.originalname}`);
            await uploadBytes(storageRef, resizedBuffer);
            const url = await getDownloadURL(storageRef);
            // Yeni kategori belgesini Firestore'da "categories" koleksiyonuna ekleyin
            const categoryRef = doc(collection(db, 'categories'));



            await setDoc(categoryRef, {
                title,
                subCategory,
                image: url
            });

            res.status(201).json({
                title,
                subCategory,
                image: url
            });
        } catch (error) {
            next(createError(500, 'Kategori oluşturulamadı: ' + error.message));
        }
    }

    static update = async (req, res, next) => {
        try {
            const categoryId = req.params.id;
            const { title, subCategory, image } = req.body;

            // Firestore'da güncellenecek kategori belgesini alın
            const categoryRef = doc(db, 'categories', categoryId);
            const categoryDoc = await getDoc(categoryRef);

            if (!categoryDoc.exists()) {
                return next(createError(404, 'Güncellenecek kategori bulunamadı'));
            }

            // Kategori belgesini güncelleyin
            await updateDoc(categoryRef, {
                title,
                subCategory,
                image
            });

            res.status(200).json({
                title,
                subCategory,
                image
            });
        } catch (error) {
            next(createError(500, 'Kategori güncellenemedi: ' + error.message));
        }
    }

    static get = async (req, res, next) => {
        try {
            const categoryId = req.params.id;

            // Firestore'dan belirli bir kategori belgesini alın
            const categoryDoc = await getDoc(doc(db, 'categories', categoryId));

            if (!categoryDoc.exists()) {
                return next(createError(404, 'Kategori bulunamadı'));
            }

            res.status(200).json(categoryDoc.data());
        } catch (error) {
            next(createError(500, 'Kategori alınamadı: ' + error.message));
        }
    }

    static getAll = async (req, res, next) => {
        try {
            // Firestore'dan tüm kategori belgelerini alın
            const querySnapshot = await getDocs(collection(db, 'categories'));
            const categories = [];
            querySnapshot.forEach((doc) => {
                categories.push(doc.data());
            });

            res.status(200).json(categories);
        } catch (error) {
            next(createError(500, 'Kategoriler alınamadı: ' + error.message));
        }
    }

    static delete = async (req, res, next) => {
        try {
            const categoryId = req.params.id;

            // Firestore'da kategori belgesini silin
            await deleteDoc(doc(db, 'categories', categoryId));

            res.status(200).json({ message: 'Kategori başarıyla silindi' });
        } catch (error) {
            next(createError(500, 'Kategori silinemedi: ' + error.message));
        }
    }
}

export default CategoryController;
