import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    userId?: string;
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        res.status(401).json({message: 'Not allowed'});
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret');

        if (decoded) {
            req.userId = (decoded as jwt.JwtPayload).userId;
        }
        next();
    } catch (error) {
        res.status(401).json({message: 'Token is not valid'});
    }
};
