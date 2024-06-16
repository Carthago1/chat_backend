import pool from '../config/database';
import { IUser } from '../common/types';
import { RowDataPacket, FieldPacket } from 'mysql2';

interface IGetUserFromDB extends IUser, RowDataPacket {}

export const createUser = async (username: string, hashedPassword: string): Promise<void> => {
    await pool.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
};

export const findUserByUsername = async (username: string): Promise<IUser | null> => {
    const [rows]: [IGetUserFromDB[], FieldPacket[]] = await pool.execute(`
        SELECT * FROM users WHERE username = ?`
    , [username]);
    return rows.length > 0 ? rows[0] : null;
};

export const findUserById = async (id: string | number): Promise<IUser | null> => {
    const [rows]: [IGetUserFromDB[], FieldPacket[]] = await pool.execute(`
        SELECT * FROM users WHERE id = ?`
    , [id]);
    return rows.length > 0 ? rows[0] : null;
};

export const searchUsers = async (username: string): Promise<IUser[]> => {
    const [rows]: [IGetUserFromDB[], FieldPacket[]] = await pool.execute(`
        SELECT * FROM users WHERE username LIKE CONCAT(?, "%")`
    , [username]);
    
    if (!rows) {
        return [];
    }

    const users: IUser[] = rows.map(row => ({
        id: row.id,
        username: row.username,
    }));
    
    return users;
};
