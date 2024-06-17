import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";
import { createError } from '../../middlewares/errorHandler.js'; // errorHandler'dan createError fonksiyonunu import ediyoruz
import multer from 'multer';
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { db } from "../../database/firebase.config.js";

// import serviceAccount from "../../cafe-cd33f-firebase-adminsdk-k73q2-ad9cb6a0b1.json"assert { type: 'json' };





const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });


class Admin {
    static register = async (req, res, next) => {
        try {
            const ownerId = req.user.id;
            const newBusinessRef = doc(collection(db, "businesses"));
            const newBusinessData = { ...req.body, owner: ownerId };
            await setDoc(newBusinessRef, newBusinessData);

            const userRef = doc(db, "users", ownerId);
            await updateDoc(userRef, { business: newBusinessRef.id });

            res.status(202).json({
                success: true,
                data: { id: newBusinessRef.id, ...newBusinessData }
            });
        } catch (error) {
            next(createError(500, 'İşletme kaydedilemedi: ' + error.message));
        }
    };

    static update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const businessRef = doc(db, "businesses", id);
            await updateDoc(businessRef, req.body);

            const updatedBusiness = await getDoc(businessRef);
            res.status(200).json({
                success: true,
                data: { id, ...updatedBusiness.data() }
            });
        } catch (error) {
            next(createError(500, 'İşletme güncellenemedi: ' + error.message));
        }
    };

    static delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const businessRef = doc(db, "businesses", id);
            await deleteDoc(businessRef);
            res.status(200).json({
                success: true,
                data: { id }
            });
        } catch (error) {
            next(createError(500, 'İşletme silinemedi: ' + error.message));
        }
    };

    static get = async (req, res, next) => {
        try {
            const { id } = req.params;
            const businessRef = doc(db, "businesses", id);
            const businessDoc = await getDoc(businessRef);

            if (!businessDoc.exists()) {
                return next(createError(404, 'İşletme bulunamadı'));
            }

            res.status(200).json({
                success: true,
                data: { id, ...businessDoc.data() }
            });
        } catch (error) {
            next(createError(500, 'İşletme alınamadı: ' + error.message));
        }
    };

    static getAll = async (req, res, next) => {
        try {
            const businessesQuery = query(collection(db, "businesses"));
            const businessesSnapshot = await getDocs(businessesQuery);

            const allBusinesses = businessesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.status(200).json({
                success: true,
                data: allBusinesses
            });
        } catch (error) {
            next(createError(500, 'Tüm işletmeler alınamadı: ' + error.message));
        }
    };

    static login = async (req, res, next) => {
        const { email, password } = req.body;
        // const auth = getAuth();
        try {
            const usersQuery = query(collection(db, "users"), where("email", "==", email));
            const usersSnapshot = await getDocs(usersQuery);

            if (usersSnapshot.empty) {
                return next(createError(401, 'Geçersiz kimlik bilgileri'));
            }

            const userDoc = usersSnapshot.docs[0];
            const user = userDoc.data();

            const isValidPassword = await bcrypt.compare(password, user.password);


            if (!isValidPassword) {
                return next(createError(401, 'Geçersiz kimlik bilgileri'));
            }

            const token = jwt.sign({ id: userDoc.id, role: user.role, business: user.business }, process.env.SECRET_KEY, { expiresIn: '1h' });
            res.status(200).json({ token });
        } catch (error) {
            next(createError(500, 'Giriş yapılamadı: ' + error.message));
        }
    };
    // static loginWithGoogle = async (req, res, next) => {
    //     const { token } = req.body;
    //     try {
    //         const decodedToken = await admin.auth().verifyIdToken(token);
    //         res.status(200).send(decodedToken);
    //     } catch (error) {
    //         res.status(401).send('Unauthorized');
    //     }
    // }
}

export default Admin;
