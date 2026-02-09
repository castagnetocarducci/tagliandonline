import {randomBytes} from "node:crypto";
import {compare, hash} from "bcrypt";

const saltRounds = 10;
export const generatePasswordHash = async (password: string) => {
    return hash(password, saltRounds);
}

export const passwordResetTokenByteLength = 32;
export const generatePasswordResetToken = () => {
    return randomBytes(passwordResetTokenByteLength).toString("hex");
}

export const comparePasswords = async (password: string, hash: string) => {
    return compare(password, hash);
}

export const checkPasswordStrength = (password: string): boolean => {
    // 12 caratteri almeno una maiuscola, una minuscola, un numero e un carattere speciale
    const regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*,.()\[\]/\\"'-]).{12,}$/;
    return regex.test(password);
}
