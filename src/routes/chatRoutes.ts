import express from 'express';
import { getMyChats, getChatMessages, addMessage } from '../controllers/chatController';
import { auth } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/chats', auth, getMyChats);
router.get('/messages', auth, getChatMessages);
router.post('/messages', auth, addMessage);

export default router;
