import { Request, Response } from 'express';
import { searchUsers, findUserById } from '../models/userModel';
import { AuthRequest } from '../middlewares/authMiddleware';

export const findUser = async (req: Request, res: Response): Promise<void> => {
    const username = req.query.username as string;

    if (!username) {
        res.status(400).json({message: 'Invalid username parameter'});
        return;
    }

    try {
        const users = await searchUsers(username);
        res.json(users);
    } catch (error) {
        res.status(400).json({message: 'Error during search'});
    }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req?.userId;

        if (!userId) {
            res.status(400).json({message: 'No user id'});
            return;
        }

        const user = await findUserById(userId);

        if (!user) {
            res.status(404).json({message: 'User not found'});
            return;
        }

        res.json(user);
    } catch (error) {
        res.status(400).json({message: 'failed during getting user'});
    }
};
