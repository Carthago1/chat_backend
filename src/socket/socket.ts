import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { IMessage } from '../common/types';
import { ALLOW_ORIGIN } from '../common/constants';

class SocketService {
    private static instance: SocketService;
    private io: SocketServer | null = null;
    private userSockets: Map<string, string> = new Map();

    private constructor() {}

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }

        return SocketService.instance;
    }

    public setup(server: HttpServer): void {
        if (this.io) {
            return;
        }

        this.io = new SocketServer(server, {
            transports: ['websocket'],
            cors: {
                origin: ALLOW_ORIGIN,
                methods: ['GET', 'POST'],
                credentials: true,
            }
        });

        this.io.on('connection', (socket: Socket) => {
            const userId = socket.handshake.query.userId as string;
            if (userId) {
                this.userSockets.set(userId, socket.id);
            }

            socket.on('disconnect', () => {
                this.userSockets.delete(userId);
            });
        });
    }

    public sendMessage(userId: string, message: IMessage): void {
        const socketId = this.userSockets.get(userId);

        if (socketId) {
            this.io?.to(socketId).emit('newMessage', message);
        }
    }
}

export default SocketService.getInstance();
