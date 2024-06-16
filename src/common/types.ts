export interface IUser {
    id: number;
    username: string;
    password?: string;
}

export interface IChatWithOtherUsers {
    id: number;
    chatName: string;
    userJoinDate: Date;
    otherUserIds: string;
    otherUsernames: string;
    otherUserJoinDates: string;
}

export interface IMessage {
    id: number;
    chatId: number;
    userId: number;
    username: string;
    content: string;
    sentAt: Date;
}
