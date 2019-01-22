/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const nls = require("vscode-nls");
const vscode = require("vscode");
const child_process_1 = require("child_process");
const path_1 = require("path");
const localize = nls.loadMessageBundle(__filename);
function pickProcess() {
    return listProcesses().then(items => {
        let options = {
            placeHolder: localize(0, null),
            matchOnDescription: true,
            matchOnDetail: true,
            ignoreFocusOut: true
        };
        return vscode.window.showQuickPick(items, options).then(item => {
            return item ? item.pid : null;
        });
    });
}
exports.pickProcess = pickProcess;
function listProcesses() {
    return new Promise((resolve, reject) => {
        const NODE = new RegExp('^(?:node|iojs|gulp)$', 'i');
        if (process.platform === 'win32') {
            const CMD_PID = new RegExp('^(.+) ([0-9]+)$');
            const EXECUTABLE_ARGS = new RegExp('^(?:"([^"]+)"|([^ ]+))(?: (.+))?$');
            let stdout = '';
            let stderr = '';
            const cmd = child_process_1.spawn('cmd');
            cmd.stdout.on('data', data => {
                stdout += data.toString();
            });
            cmd.stderr.on('data', data => {
                stderr += data.toString();
            });
            cmd.on('exit', () => {
                if (stderr.length > 0) {
                    reject(stderr);
                }
                else {
                    const items = [];
                    const lines = stdout.split('\r\n');
                    for (const line of lines) {
                        const matches = CMD_PID.exec(line.trim());
                        if (matches && matches.length === 3) {
                            let cmd = matches[1].trim();
                            const pid = matches[2];
                            // remove leading device specifier
                            if (cmd.indexOf('\\??\\') === 0) {
                                cmd = cmd.replace('\\??\\', '');
                            }
                            let executable_path;
                            const matches2 = EXECUTABLE_ARGS.exec(cmd);
                            if (matches2 && matches2.length >= 2) {
                                if (matches2.length >= 3) {
                                    executable_path = matches2[1] || matches2[2];
                                }
                                else {
                                    executable_path = matches2[1];
                                }
                            }
                            if (executable_path) {
                                let executable_name = path_1.basename(executable_path);
                                executable_name = executable_name.split('.')[0];
                                if (!NODE.test(executable_name)) {
                                    continue;
                                }
                                items.push({
                                    label: executable_name,
                                    description: pid,
                                    detail: cmd,
                                    pid: pid
                                });
                            }
                        }
                    }
                    resolve(items);
                }
            });
            cmd.stdin.write('wmic process get ProcessId,CommandLine \n');
            cmd.stdin.end();
        }
        else {
            const PID_CMD = new RegExp('^\\s*([0-9]+)\\s+(.+)$');
            const MAC_APPS = new RegExp('^.*/(.*).(?:app|bundle)/Contents/.*$');
            child_process_1.exec('ps -ax -o pid=,command=', { maxBuffer: 1000 * 1024 }, (err, stdout, stderr) => {
                if (err || stderr) {
                    reject(err || stderr.toString());
                }
                else {
                    const items = [];
                    const lines = stdout.toString().split('\n');
                    for (const line of lines) {
                        const matches = PID_CMD.exec(line);
                        if (matches && matches.length === 3) {
                            const pid = matches[1];
                            const cmd = matches[2];
                            const parts = cmd.split(' '); // this will break paths with spaces
                            const executable_path = parts[0];
                            const executable_name = path_1.basename(executable_path);
                            if (!NODE.test(executable_name)) {
                                continue;
                            }
                            let application = cmd;
                            // try to show the correct name for OS X applications and bundles
                            const matches2 = MAC_APPS.exec(cmd);
                            if (matches2 && matches2.length === 2) {
                                application = matches2[1];
                            }
                            else {
                                application = executable_name;
                            }
                            items.unshift({
                                label: application,
                                description: pid,
                                detail: cmd,
                                pid: pid
                            });
                        }
                    }
                    resolve(items);
                }
            });
        }
    });
}

//# sourceMappingURL=../../../out/node/extension/processPicker.js.map
