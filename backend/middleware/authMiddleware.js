const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Not authorized. Please login."
            });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({
                message: "Server configuration error: JWT_SECRET missing"
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, jwtSecret);

        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

const optionalProtect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const jwtSecret = process.env.JWT_SECRET;
        if (authHeader && authHeader.startsWith("Bearer ") && jwtSecret) {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, jwtSecret);
            req.user = decoded;
        }
    } catch (error) {
        // Silently skip if token invalid in optional mode
    }
    next();
};

module.exports = {
    protect,
    optionalProtect
};