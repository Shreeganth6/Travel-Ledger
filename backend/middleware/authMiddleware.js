const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        console.log("DEBUG: Auth Header received:", authHeader);
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                message: "Token format invalid. Expected 'Bearer <token>'"
            });
        }

        let token = parts[1];
        // Remove trailing period if present (common copy-paste error or client issue)
        if (token.endsWith('.')) {
            token = token.slice(0, -1);
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded; // { user_id: ... }

        next();

    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "Token expired" });
        }
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};
