import {Router} from "express";
import {authRouter} from "./auth.ts";
import {usersRouter} from "./users.ts";

export const v1ApiRouter = Router();

v1ApiRouter.use("/auth", authRouter);
v1ApiRouter.use("/users", usersRouter);



