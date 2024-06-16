const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Bu alanda yetkiniz yok' });
        }
        next();
    };
};

export default authorize;
