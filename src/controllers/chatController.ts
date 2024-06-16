import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { findMyChats, getMessages, createChat, createMessage, getMessageInfo, getChatUsers, getChatInfo }
    from '../models/chatModel';
import socketService from '../socket/socket';

export const getMyChats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId as string;

        if (!userId) {
            res.status(400).json({message: 'No user id'});
            return;
        }
        
        const chats = await findMyChats(userId);
    
        res.json(chats);
    } catch (error) {
        res.status(400).json({message: 'failed during getting chats'});
    }
};

export const getChatMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    const chatId = req.query.chat_id as string;
    
    if (!chatId) {
        res.status(400).json({message: 'No chat id query parameter'});
        return;
    }
    
    try {
        const messages = await getMessages(chatId);
        res.json(messages);
    } catch (error) {
        res.status(400).json({message: 'failed during getting messages'});
    }
};

export const addMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId;
    const { chatId, content } = req.body;

    if (!userId || !chatId || !content) {
        res.status(400).json({message: 'lack of data'});
        return;
    }

    try {
        const insertedId = await createMessage(chatId, userId, content);
        const newMessage = await getMessageInfo(insertedId);

        if (newMessage) {
            res.json(newMessage);
            const userIds = await getChatUsers(chatId, userId);
            userIds.forEach(userId => socketService.sendMessage(userId.toString(), newMessage));
        }
    } catch (error) {
        res.status(400).json({message: 'failed during creating message'});
    }
};

export const createNewChat = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.userId;

    const { otherUserId } = req.body;

    if (!otherUserId || !userId) {
        res.status(400).json({message: 'lack of data'});
        return;
    }

    try {
        const insertedId = await createChat(userId, otherUserId);
        
        const newChat = await getChatInfo(userId, insertedId);

        res.json(newChat);
    } catch (error) {
        res.status(400).json({message: 'failed during creating chat'});
    }
};
