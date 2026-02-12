import {Router} from "express";
import {authRouter} from "./auth.ts";

export const v1ApiRouter = Router();

v1ApiRouter.use("/auth", authRouter);



