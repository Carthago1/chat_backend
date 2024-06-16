import express from 'express';
import { findUser, getMe } from '../controllers/userController';
import { auth } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/search', auth, findUser);
router.get('/whoami', auth, getMe);

export default router;
