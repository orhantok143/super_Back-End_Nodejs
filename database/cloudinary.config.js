import dotenv from 'dotenv';
import cloudinary from 'cloudinary';


dotenv.config();

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


export const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream({ resource_type: 'image', folder: 'SuperAPI/Products' }, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        }).end(buffer);
    });
};



export const deleteFromCloudinary = (public_id) => {
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.destroy(public_id, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
};

