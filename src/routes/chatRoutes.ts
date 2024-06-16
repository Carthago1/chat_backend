import express from 'express';
import { getMyChats, getChatMessages, addMessage, createNewChat } from '../controllers/chatController';
import { auth } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/chats', auth, getMyChats);
router.post('/chats', auth, createNewChat);
router.get('/messages', auth, getChatMessages);
router.post('/messages', auth, addMessage);

export default router;
