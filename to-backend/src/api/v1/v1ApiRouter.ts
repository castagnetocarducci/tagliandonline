import {Router} from "express";
import {authRouter} from "./auth.ts";
import {usersRouter} from "./users.ts";
import {docTemplatesRouter} from "./docTemplates.ts";
import {emailTemplatesRouter} from "./emailTemplates.ts";
import {numerationsRouter} from "./numerations.ts";
import {permitsRouter} from "./permits.ts";
import {downloadFileRouter} from "./downloadFile.ts";
import {vehiclesRouter} from "./vehicles.ts";
import {vouchersRouter} from "./vouchers.ts";
import {applicationsRouter} from "./applications.ts";
import {inspectionsRouter} from "./inspections.ts";

export const v1ApiRouter = Router();

v1ApiRouter.use("/auth", authRouter);
v1ApiRouter.use("/users", usersRouter);
v1ApiRouter.use("/templates/doc", docTemplatesRouter);
v1ApiRouter.use("/templates/email", emailTemplatesRouter);
v1ApiRouter.use("/numerations", numerationsRouter);
v1ApiRouter.use("/permits", permitsRouter);
v1ApiRouter.use("/download", downloadFileRouter);
v1ApiRouter.use("/vehicles", vehiclesRouter);
v1ApiRouter.use("/vouchers", vouchersRouter);
v1ApiRouter.use("/applications", applicationsRouter);
v1ApiRouter.use("/inspections", inspectionsRouter);


