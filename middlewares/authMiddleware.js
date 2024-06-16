import jwt from "jsonwebtoken"
import { createError } from "./errorHandler.js";

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log("tokenFromAuth:", token);
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (!decoded) {
            next(createError(401, "Bu token geçerli değil"))
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

export default auth;