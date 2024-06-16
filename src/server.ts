import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import socketService from './socket/socket'; 
import { ALLOW_ORIGIN } from './common/constants';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';

const app = express();
const server = http.createServer(app);

socketService.setup(server);

app.use(express.json());
app.use(cors({
    origin: ALLOW_ORIGIN,
}));

app.use('/api/auth', authRoutes);
app.use('/api', userRoutes, chatRoutes)

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server start on port ${PORT}`);
});
