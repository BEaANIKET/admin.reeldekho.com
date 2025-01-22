import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';

export const verifyLogin = async (req, res, next) => {
    try {
        const token = req.headers?.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Token not provided"
            });
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
                error: err.message
            });
        }

        if (!decodedToken || !decodedToken._id) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token payload'
            });
        }

        let user;
        try {
            user = await User.findById(decodedToken._id).select('-password');
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: 'Database query failed',
                error: err.message
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};
