import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername } from '../models/userModel';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password);

    try {
        await createUser(username, hashedPassword);
        res.json({message: 'success registration'});
    } catch (error) {
        res.status(400).json({message: 'Error during registration'});
    }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    try {
        const user = await findUserByUsername(username);

        if (!user || !user.password) {
            res.status(400).json({message: 'User not found'});
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(400).json({message: 'Invalid password'});
            return;
        }

        const token = jwt.sign({userId: user.id}, process.env.JWT_SECRET || 'jwt_secret');
        res.json({token});
    } catch (error) {
        res.status(400).json({message: 'Error during signin'});
    }
};
