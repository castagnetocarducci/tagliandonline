import {spawnSync} from "node:child_process";
import {ConfigProvider} from "./configProvider.js";

// import {promisify} from "node:util";
// import {exec as execNoPromise} from "node:child_process";
// const execAsync = promisify(execNoPromise);

type RunCmdOptions = {
    cwd?: string,
}

export const runCmd = async (cmd: string, optionsArgs?: RunCmdOptions): Promise<boolean> => {
    console.log("Executing command: " + cmd);
    let options: RunCmdOptions = {
        cwd: process.cwd(),
    };
    if (optionsArgs != null) {
        options = {...options, ...optionsArgs};
    }

    try {
        // utilizzo spawn perché crea un nuovo processo
        const result = spawnSync(cmd, {
            shell: true,
            cwd: options.cwd || process.cwd(),
            encoding: "utf8",
            timeout: ConfigProvider.instance.configs.pdfPrintTimeoutMs,
        });
        console.log("stdout: " + result.stdout);
        console.log("stderr: " + result.stderr);
        console.log("status: " + result.status);
        console.log("signal: " + result.signal);
        console.log("error: " + result.error);
        return true;
    } catch (e) {
        console.error("Execution failed");
        console.error(e);
        return false;
    }
}

