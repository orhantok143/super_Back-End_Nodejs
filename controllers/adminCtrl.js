import Business from '../models/businessModel.js';
import User from '../models/userModel.js';
import jwt from "jsonwebtoken";
import { createError } from '../middlewares/errorHandler.js';

class Admin {
    static register = async (req, res, next) => {
        try {
            req.body.owner = req.user.id;
            const newBusiness = await Business.create(req.body);
            await User.findByIdAndUpdate(req.user.id, { business: newBusiness }, { new: true });
            res.status(202).json({
                success: true,
                data: newBusiness
            });
        } catch (error) {
            next(createError(500, 'İşletme kaydedilemedi: ' + error.message));
        }
    };

    static update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const updatedBusiness = await Business.findByIdAndUpdate({ _id: id }, req.body, { new: true });
            res.status(200).json({
                success: true,
                data: updatedBusiness
            });
        } catch (error) {
            next(createError(500, 'İşletme güncellenemedi: ' + error.message));
        }
    };

    static delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const deletedBusiness = await Business.findByIdAndDelete({ _id: id });
            res.status(200).json({
                success: true,
                data: deletedBusiness
            });
        } catch (error) {
            next(createError(500, 'İşletme silinemedi: ' + error.message));
        }
    };

    static get = async (req, res, next) => {
        try {
            const { id } = req.params;
            const aBusiness = await Business.findById({ _id: id });
            res.status(200).json({
                success: true,
                data: aBusiness
            });
        } catch (error) {
            next(createError(500, 'İşletme alınamadı: ' + error.message));
        }
    };

    static getAll = async (req, res, next) => {
        try {
            const allBusiness = await Business.find();
            res.status(200).json({
                data: allBusiness
            });
        } catch (error) {
            next(createError(500, 'Tüm işletmeler alınamadı: ' + error.message));
        }
    };

    static login = async (req, res, next) => {
        const { email, password } = req.body;
        try {
            const user = await User.findOne({ email });

            if (!user) {
                return next(createError(401, 'Böyle bir kullanıcı yoktur.'));
            }

            const isPasswordMatch = await user.isMatch(password);
            if (!isPasswordMatch) {
                return next(createError(401, 'Geçersiz kimlik bilgileri'));
            }

            const token = jwt.sign({ id: user._id, role: user.role, business: user.business }, process.env.SECRET_KEY);
            res.status(200).json({ token, user });
        } catch (error) {
            next(createError(500, 'Giriş yapılamadı: ' + error.message));
        }
    };

    static checkToken = async (req, res, next) => {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log(token);
        try {
            if (token) {
                const userFind = await User.findById(req.user.id)
                res.status(200).json({
                    userFind,
                    token
                })
                next()
            }

        } catch (error) {
            next(createError(500, "Token bulunamadı", error.message))
        }

    }
}


export default Admin;
