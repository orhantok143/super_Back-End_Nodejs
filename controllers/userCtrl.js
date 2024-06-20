import { createError } from "../middlewares/errorHandler.js"; // errorHandler'dan createError fonksiyonunu import ediyoruz
import cloudinary from 'cloudinary';
import sharp from 'sharp';
import User from '../models/userModel.js'; // User modelini import ediyoruz

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});




class userCtrl {
    static register = async (req, res, next) => {
        try {
            const newUser = await User.create(req.body);
            res.status(200).json({
                message: "Kullanıcı başarıyla oluşturuldu",
                data: newUser
            });
        } catch (error) {
            next(createError(500, "bir sorun oluştu")); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }

    static update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
            if (!updatedUser) {
                throw createError(404, 'Kullanıcı bulunamadı');
            }
            res.status(200).json({
                message: "Kullanıcı başarıyla güncellendi",
                data: updatedUser
            });
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }

    static delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const deletedUser = await User.findByIdAndDelete(id);
            if (!deletedUser) {
                throw createError(404, 'Kullanıcı bulunamadı');
            }
            res.status(200).json({
                success: true,
                message: "Kullanıcı başarıyla silindi",
                data: deletedUser
            });
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }

    static get = async (req, res, next) => {
        try {
            const { id } = req.params;
            const aUser = await User.findOne({ _id: id });
            if (!aUser) {
                throw createError(404, 'Kullanıcı bulunamadı');
            }
            res.status(200).json({
                success: true,
                data: aUser
            });
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }

    static getAll = async (req, res, next) => {
        try {
            const allUsers = await User.find();
            res.status(200).json({
                success: true,
                data: allUsers
            });
        } catch (error) {
            next(error); // Hata meydana geldiğinde hata işleyiciyi çağır
        }
    }

    static uploadImage = async (req, res, next) => {
        try {
            const file = req.file;

            if (!file) {
                return next(createError(400, 'No file uploaded'));
            }

            // Resize the image using Sharp
            const resizedBuffer = await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside' })
                .toBuffer();

            cloudinary.v2.uploader.upload_stream({ resource_type: 'image', folder: 'SuperAPI' }, (error, result) => {
                if (error) {
                    return next(createError(500, 'Upload failed: ' + error.message));
                }
                res.status(200).json({ url: result.secure_url, id: result.public_id });
            }).end(resizedBuffer);
        } catch (error) {
            next(createError(500, 'Upload failed: ' + error.message));
        }
    }

    static deleteImage = async (req, res, next) => {
        try {
            const { id } = req.body;
            if (!id) {
                return next(createError(400, 'No public_id provided'));
            }

            cloudinary.v2.uploader.destroy(id, (error, result) => {
                if (error) {
                    return next(createError(500, 'Deletion failed: ' + error.message));
                }
                res.status(200).json({ message: 'File deleted successfully' });
            });
        } catch (error) {
            next(createError(500, 'Deletion failed: ' + error.message));
        }
    }
}

export default userCtrl;
