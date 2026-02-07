import {hash} from "bcrypt";

const saltRounds = 10;
export const generatePasswordHash = async (password: string) => {
    return hash(password, saltRounds);
}

