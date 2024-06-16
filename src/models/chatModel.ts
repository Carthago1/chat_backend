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
        GROUP BY c.id
        ORDER BY cm1.joinedAt DESC;
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

export const getChatInfo = async (userId: string, chatId: number): Promise<IFormattedMyChat> => {
    const [rows]: [IGetMyChatsFromDB[], FieldPacket[]] = await pool.execute(`
        SELECT c.id AS id, 
            c.name AS chatName, 
            cm1.joinedAt AS joinDate, 
            u2.id AS otherUserIds,
            u2.username AS otherUsernames,
            cm2.joinedAt AS otherUserJoinDates
        FROM chats c
        INNER JOIN chat_members cm1 ON c.id = cm1.chatId
        INNER JOIN users u1 ON cm1.userId = u1.id
        INNER JOIN chat_members cm2 ON c.id = cm2.chatId AND cm2.userId <> cm1.userId
        INNER JOIN users u2 ON cm2.userId = u2.id
        WHERE cm1.userId = ? AND c.id = ?
    `, [userId, chatId]);

    const formattedRows = rows.map(row => ({
        ...row,
        otherUserIds: row.otherUserIds ? [+row.otherUserIds] : [],
        otherUsernames: row.otherUsernames ? [row.otherUsernames] : [],
        otherUserJoinDates: row.otherUserJoinDates ? [new Date(row.otherUserJoinDates)] : [],
    }));

    return formattedRows[0];
}

export const createChat = async (firstUserId: string, secondUserId: string): Promise<number> => {
    let chatId: number | null = null;
    
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
    
        const [chatInsertResult]: [ResultSetHeader, FieldPacket[]] = await connection.execute(`
            INSERT INTO chats (name) VALUES (NULL)
        `);
        chatId = chatInsertResult.insertId;
        await connection.execute(`
            INSERT INTO chat_members (chatId, userId) VALUES (?, ?)
        `, [chatId, firstUserId]);    
        await connection.execute(`
            INSERT INTO chat_members (chatId, userId) VALUES (?, ?)
        `, [chatId, secondUserId]);
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error('Transaction failed:', error);
        throw error;
    } finally {
        connection.release();
    }

    return chatId;
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
