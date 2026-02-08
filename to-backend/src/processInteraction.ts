import {spawnSync} from "node:child_process";
import {ConfigProvider} from "./configProvider.js";

type RunCmdOptions = {
    cwd?: string,
    shell?: boolean
}

type CmdOutput = {
    out?: string,
    err?: string,
    success: boolean
}

export const runCmdAsync = async (cmd: string, options: RunCmdOptions = {}): Promise<CmdOutput> => {
    return runCmd(cmd, options);
}

export const runCmd = (cmd: string, options: RunCmdOptions = {}): CmdOutput => {
    options = {
        cwd: process.cwd(),
        shell: true,
        ...options
    };

    console.log("Executing command: " + cmd);
    try {
        // utilizzo spawn perché crea un nuovo processo
        const result = spawnSync(cmd, {
            shell: options.shell,
            cwd: options.cwd,
            encoding: "utf8",
            timeout: ConfigProvider.instance.configs.pdfPrintTimeoutMs,
        });
        const res: CmdOutput = {
            out: "PID: " + result.pid + (result.stdout != "" ? "\n" + result.stdout : ""),
            err: result.stderr,
            success: true,
        }
        if (res.err != "") {
            res.success = false;
        }
        if (result.status != null && result.status !== 0) {
            if (res.err != "") {
                res.err += "\n";
            }
            res.err += "Exit code: " + result.status;
            res.success = false;
        }
        if (result.signal != null) {
            if (res.err != "") {
                res.err += "\n";
            }
            res.err += "Signal: " + result.signal;
            res.success = false;
        }
        if (result.error != null) {
            if (res.err != "") {
                res.err += "\n";
            }
            res.err += result.error.toString();
            res.success = false;
        }
        if (!res.success) {
            console.error("Execution failed: ");
            console.error(res);
        }
        return res;
    } catch (e) {
        console.error("Execution failed");
        console.error(e);
        const errMsg = e instanceof Error ? e.toString() : "Unknown error."
        return {
            err: errMsg,
            success: false
        };
    }
}

