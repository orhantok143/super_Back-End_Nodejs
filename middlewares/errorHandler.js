import mongoose from 'mongoose';
import { ValidationError } from 'express-validation';

// Özel hata sınıfı
class CustomError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
    }
}

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err instanceof mongoose.Error.ValidationError) {
        const errors = Object.values(err.errors).map(el => el.message);
        const fields = Object.keys(err.errors);
        const message = `Doğrulama hatası: ${errors.join(', ')}`;
        res.status(400).json({ success: false, message, fields });
    } else if (err instanceof mongoose.Error) {
        res.status(500).json({ success: false, message: 'Veritabanı hatası' });
    } else if (err.name === 'UnauthorizedError') {
        res.status(401).json({ success: false, message: 'Yetkilendirme hatası: Giriş yapmanız gerekiyor' });
    } else if (err instanceof ValidationError) {
        const errors = err.details.body.map(el => el.message);
        const message = `Doğrulama hatası: ${errors.join(', ')}`;
        res.status(400).json({ success: false, message });
    } else if (err instanceof CustomError) {
        const { statusCode, message } = err;
        res.status(statusCode).json({ success: false, message });
    } else {
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
};

// Kullanıcı tanımlı hata oluşturma fonksiyonu
export const createError = (statusCode, message) => {
    return new CustomError(statusCode, message);
};

export default errorHandler;
