import {randomBytes} from "node:crypto";
import {compare, hash} from "bcrypt";

const saltRounds = 10;
export const generatePasswordHash = async (password: string) => {
    return hash(password, saltRounds);
}

export const passwordResetTokenLength = 32;
export const generatePasswordResetToken = () => {
    return randomBytes(passwordResetTokenLength).toString("hex");
}

export const comparePasswords = async (password: string, hash: string) => {
    return compare(password, hash);
}

