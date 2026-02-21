import {Router} from "express";
import {authRouter} from "./auth.ts";
import {usersRouter} from "./users.ts";
import {docTemplatesRouter} from "./docTemplates.ts";
import {emailTemplatesRouter} from "./emailTemplates.ts";
import {numerationsRouter} from "./numerations.ts";
import {permitsRouter} from "./permits.ts";
import {downloadFileRouter} from "./downloadFile.ts";

export const v1ApiRouter = Router();

v1ApiRouter.use("/auth", authRouter);
v1ApiRouter.use("/users", usersRouter);
v1ApiRouter.use("/templates/doc", docTemplatesRouter);
v1ApiRouter.use("/templates/email", emailTemplatesRouter);
v1ApiRouter.use("/numerations", numerationsRouter);
v1ApiRouter.use("/permits", permitsRouter);
v1ApiRouter.use("/download", downloadFileRouter);

