import cloudinary from 'cloudinary';
import multer from 'multer';
import sharp from 'sharp';
import dotenv from "dotenv"
import { createError } from '../middlewares/errorHandler.js';

dotenv.config()



cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


const storage = multer.memoryStorage();
const upload = multer({ storage });

class ImageController {
    static async uploadImage(req, res, next) {
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

    static async deleteImage(req, res, next) {
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

export default ImageController;
