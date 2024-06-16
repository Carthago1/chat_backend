import pool from '../config/database';
import { IChatWithOtherUsers, IMessage } from '../common/types';
import { RowDataPacket, FieldPacket, ResultSetHeader } from 'mysql2';

interface IGetMyChatsFromDB extends IChatWithOtherUsers, RowDataPacket {}
interface IGetMessageFromDB extends IMessage, RowDataPacket {}

interface IFormattedMyChat extends Omit<IGetMyChatsFromDB, 'otherUserIds' | 'otherUsernames' | 'otherUserJoinDates'> {
    otherUserIds: number[];
    otherUsernames: string[];
    otherUserJoinDates: Date[];
}

export const findMyChats = async (userId: string): Promise<IFormattedMyChat[]> => {
    const [rows]: [IGetMyChatsFromDB[], FieldPacket[]] = await pool.execute(`
        SELECT c.id AS id, 
            c.name AS chatName, 
            cm1.joinedAt AS joinDate, 
            GROUP_CONCAT(u2.id ORDER BY u2.id ASC) AS otherUserIds,
            GROUP_CONCAT(u2.username ORDER BY u2.id ASC) AS otherUsernames,
            GROUP_CONCAT(cm2.joinedAt ORDER BY u2.id ASC) AS otherUserJoinDates
        FROM chats c
        INNER JOIN chat_members cm1 ON c.id = cm1.chatId
        INNER JOIN users u1 ON cm1.userId = u1.id
        INNER JOIN chat_members cm2 ON c.id = cm2.chatId AND cm2.userId <> cm1.userId
        INNER JOIN users u2 ON cm2.userId = u2.id
        WHERE cm1.userId = ?
        GROUP BY c.id;
    `, [userId]);

    const formattedRows = rows.map(row => ({
        ...row,
        otherUserIds: row.otherUserIds ? row.otherUserIds.split(',').map((id: string) => parseInt(id)) : [],
        otherUsernames: row.otherUsernames ? row.otherUsernames.split(',') : [],
        otherUserJoinDates: row.otherUserJoinDates ?
            row.otherUserJoinDates.split(',').map((date: string) => new Date(date)) : [],
    }));

    return formattedRows;
};

export const createChat = async (firstUserId: string, secondUserId: string): Promise<void> => {
    await pool.execute(`
        START TRANSACTION;
        INSERT INTO chats (name) VALUES (NULL);
        SET @chatId = LAST_INSERT_ID();
        INSERT INTO chat_members (chatId, userId) VALUES (@chatId, ?);
        INSERT INTO chat_members (chatId, userId) VALUES (@chatId, ?);
        COMMIT;
    `, [firstUserId, secondUserId]);
};

export const getMessages = async (chatId: string): Promise<IGetMessageFromDB[]> => {
    const [rows]: [IGetMessageFromDB[], FieldPacket[]] = await pool.execute(`
        SELECT m.id,
            m.chatId,
            m.userId,
            u.username,
            m.content,
            m.sentAt
        FROM message m
        INNER JOIN users u on u.id = m.userId 
        WHERE chatId = ?
        ORDER BY m.sentAt;
    `, [chatId]);

    return rows.length === 0 ? [] : rows;
};

export const createMessage = async (chatId: string, userId: string, content: string): Promise<number> => {
    const [result]: [ResultSetHeader, FieldPacket[]] = await pool.execute(`
        INSERT INTO message (chatId, userId, content) VALUES (?, ?, ?);
    `, [chatId, userId, content]);

    return result.insertId;
};

export const getMessageInfo = async (messageId: string | number): Promise<IGetMessageFromDB | null> => {
    const [rows]: [IGetMessageFromDB[], FieldPacket[]] = await pool.execute(`
        SELECT * 
        FROM message 
        WHERE id = ?;
    `, [messageId]);

    return rows.length > 0 ? rows[0] : null;
};

interface userChatId extends RowDataPacket {
    userId: number;
}

export const getChatUsers = async (chatId: string, userId: string): Promise<number[]> => {
    const [rows]: [userChatId[], FieldPacket[]] = await pool.execute(`
        SELECT userId
        FROM chat_members
        WHERE chatId = ? AND userId <> ?;
    `, [chatId, userId]);

    return rows.map(row => row.userId);
};
