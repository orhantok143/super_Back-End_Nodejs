import { createError } from "../../middlewares/errorHandler.js"; // errorHandler'dan createError fonksiyonunu import ediyoruz
import sharp from 'sharp';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../database/firebase.config.js";
import bcrypt from "bcrypt-nodejs"


class userCtrl {
    static register = async (req, res, next) => {
        try {
            const userRef = doc(collection(db, "users"));

            const hashPass = await bcrypt.genSalt(10)
                .then(salt => bcrypt.hash(req.body.password, salt));
            req.body.password = hashPass
            const newUser = { ...req.body, id: userRef.id };
            await setDoc(userRef, newUser);
            res.status(200).json({
                message: "Kullanıcı başarıyla oluşturuldu",
                data: newUser
            });
        } catch (error) {
            next(createError(500, 'Kullanıcı oluşturulamadı: ' + error.message));
        }
    }
    static update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userRef = doc(db, "users", id);
            await updateDoc(userRef, req.body);

            const updatedUserDoc = await getDoc(userRef);
            if (!updatedUserDoc.exists()) {
                throw createError(404, 'Kullanıcı bulunamadı');
            }
            res.status(200).json({
                message: "Kullanıcı başarıyla güncellendi",
                data: { id, ...updatedUserDoc.data() }
            });
        } catch (error) {
            next(createError(500, 'Kullanıcı güncellenemedi: ' + error.message));
        }
    }

    static delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userRef = doc(db, "users", id);
            await deleteDoc(userRef);
            res.status(200).json({
                success: true,
                message: "Kullanıcı başarıyla silindi",
                data: { id }
            });
        } catch (error) {
            next(createError(500, 'Kullanıcı silinemedi: ' + error.message));
        }
    }

    static get = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userRef = doc(db, "users", id);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                throw createError(404, 'Kullanıcı bulunamadı');
            }

            res.status(200).json({
                success: true,
                data: { id, ...userDoc.data() }
            });
        } catch (error) {
            next(createError(500, 'Kullanıcı alınamadı: ' + error.message));
        }
    }

    static getAll = async (req, res, next) => {
        try {
            const usersQuery = collection(db, "users");
            const usersSnapshot = await getDocs(usersQuery);

            const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.status(200).json({
                success: true,
                data: allUsers
            });
        } catch (error) {
            next(createError(500, 'Tüm kullanıcılar alınamadı: ' + error.message));
        }
    }

    static uploadImage = async (req, res, next) => {
        try {
            const file = req.file;

            if (!file) {
                return next(createError(400, 'Dosya yüklenmedi'));
            }

            // Resize the image using Sharp
            const resizedBuffer = await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside' })
                .toBuffer();

            // Upload image to Firebase Cloud Storage
            const storageRef = ref(storage, `SuperAPI/${Date.now()}_${file.originalname}`);
            const metadata = {
                contentType: file.mimetype
            };

            const snapshot = await uploadBytes(storageRef, resizedBuffer, metadata);
            const downloadURL = await getDownloadURL(snapshot.ref);

            res.status(200).json({ url: downloadURL, id: snapshot.ref.name });
        } catch (error) {
            next(createError(500, 'Yükleme başarısız: ' + error.message));
        }
    }

    static deleteImage = async (req, res, next) => {
        try {
            const { id } = req.body;
            if (!id) {
                return next(createError(400, 'public_id sağlanmadı'));
            }

            const storageRef = ref(storage, `SuperAPI/${id}`);

            await deleteObject(storageRef);
            res.status(200).json({ message: 'Dosya başarıyla silindi' });
        } catch (error) {
            next(createError(500, 'Silme başarısız: ' + error.message));
        }
    }
}

export default userCtrl;
