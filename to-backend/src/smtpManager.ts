import {createTransport} from "nodemailer";
import {ConfigProvider} from "./configProvider.ts";
import type Mail from "nodemailer/lib/mailer/index.d.ts";
import type {ErrOrSuccess} from "./utils/commonTypes.ts";
import {getErrorString} from "./utils/commonFunctions.ts";

export class SmtpManager {
    static #instance: SmtpManager;
    transporter;

    public static get instance(): SmtpManager {
        if (!SmtpManager.#instance) {
            SmtpManager.#instance = new SmtpManager();
        }
        return SmtpManager.#instance;
    }

    private constructor() {
        this.transporter = createTransport({
            host: ConfigProvider.instance.configs.smtpHost,
            port: ConfigProvider.instance.configs.smtpPort,
            secure: ConfigProvider.instance.configs.smtpSecure,
            auth: {
                user: ConfigProvider.instance.configs.smtpUser,
                pass: ConfigProvider.instance.configs.smtpPassword,
            },
        });
    }

    public async verifyConnection() {
        try {
            this.transporter.verify();
            console.log("SMTP connection verified");
        } catch (e) {
            console.error("SMTP connection failed: ", e);
        }
    }

    public async sendTestMail(to: string) {
        try {
            await this.transporter.sendMail({
                from: ConfigProvider.instance.configs.smtpUser,
                to: to,
                subject: "Test email from TagliandOnline",
                text: "This is a test email sent from TagliandOnline.",
            });
        } catch (e) {
            console.error("SMTP test mail failed: ", e);
        }
    }

    public async sendMail(mailOptions: Mail.Options): Promise<ErrOrSuccess> {
        try {
            const msgInfo = await this.transporter.sendMail(mailOptions);
            if (msgInfo.rejected != null && msgInfo.rejected.length > 0) {
                const errStr = "SMTP mail failed to send mail to " + msgInfo.rejected + ": " + msgInfo.response;
                console.error(errStr);
                return {
                    err: errStr,
                    success: false,
                };
            }
            console.log("SMTP mail sent with msgId: {}" + msgInfo.messageId);
            return {
                success: true,
            }
        } catch (e) {
            console.error("SMTP mail failed: ", e);
            return {
                err: getErrorString(e),
                success: false,
            };
        }
    }
}

