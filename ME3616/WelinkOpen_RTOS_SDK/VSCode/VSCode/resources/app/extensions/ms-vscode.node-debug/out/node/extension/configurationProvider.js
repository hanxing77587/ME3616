/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const nls = require("vscode-nls");
const vscode = require("vscode");
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs = require("fs");
const utilities_1 = require("./utilities");
const protocolDetection_1 = require("./protocolDetection");
const processPicker_1 = require("./processPicker");
const childProcesses_1 = require("./childProcesses");
const localize = nls.loadMessageBundle(__filename);
//---- NodeConfigurationProvider
class NodeConfigurationProvider {
    constructor(_extensionContext) {
        this._extensionContext = _extensionContext;
    }
    /**
     * Returns an initial debug configuration based on contextual information, e.g. package.json or folder.
     */
    provideDebugConfigurations(folder, token) {
        return [createLaunchConfigFromContext(folder, false)];
    }
    /**
     * Try to add all missing attributes to the debug configuration being launched.
     */
    resolveDebugConfiguration(folder, config, token) {
        // if launch.json is missing or empty
        if (!config.type && !config.request && !config.name) {
            config = createLaunchConfigFromContext(folder, true, config);
            if (!config.program) {
                const message = localize(0, null);
                return vscode.window.showErrorMessage(message, { modal: true }).then(_ => {
                    return undefined; // abort launch
                });
            }
        }
        // make sure that config has a 'cwd' attribute set
        if (!config.cwd) {
            if (folder) {
                config.cwd = folder.uri.fsPath;
            }
            // no folder -> config is a user or workspace launch config
            if (!config.cwd && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                config.cwd = vscode.workspace.workspaceFolders[0].uri.fsPath;
            }
            // no folder case
            if (!config.cwd && config.program === '${file}') {
                config.cwd = '${fileDirname}';
            }
            // program is some absolute path
            if (!config.cwd && path_1.isAbsolute(config.program)) {
                // derive 'cwd' from 'program'
                config.cwd = path_1.dirname(config.program);
            }
            // last resort
            if (!config.cwd) {
                config.cwd = '${workspaceFolder}';
            }
        }
        // remove 'useWSL' on all platforms but Windows
        if (process.platform !== 'win32' && config.useWSL) {
            this._extensionContext.logger.debug('useWSL attribute ignored on non-Windows OS.');
            delete config.useWSL;
        }
        // when using "integratedTerminal" ensure that debug console doesn't get activated; see #43164
        if (config.console === 'integratedTerminal' && !config.internalConsoleOptions) {
            config.internalConsoleOptions = 'neverOpen';
        }
        // "nvm" support
        if (config.runtimeVersion && config.runtimeVersion !== 'default') {
            // if a runtime version is specified we prepend env.PATH with the folder that corresponds to the version
            let bin = undefined;
            let versionManagerName = undefined;
            // first try the Node Version Switcher 'nvs'
            let nvsHome = process.env['NVS_HOME'];
            if (!nvsHome) {
                // NVS_HOME is not always set. Probe for 'nvs' directory instead
                const nvsDir = process.platform === 'win32' ? path_1.join(process.env['LOCALAPPDATA'], 'nvs') : path_1.join(process.env['HOME'], '.nvs');
                if (fs.existsSync(nvsDir)) {
                    nvsHome = nvsDir;
                }
            }
            const { nvsFormat, remoteName, semanticVersion, arch } = parseVersionString(config.runtimeVersion);
            if (nvsFormat || nvsHome) {
                if (nvsHome) {
                    bin = path_1.join(nvsHome, remoteName, semanticVersion, arch);
                    if (process.platform !== 'win32') {
                        bin = path_1.join(bin, 'bin');
                    }
                    versionManagerName = 'nvs';
                }
                else {
                    return vscode.window.showErrorMessage(localize(1, null), { modal: true }).then(_ => {
                        return undefined; // abort launch
                    });
                }
            }
            if (!bin) {
                // now try the Node Version Manager 'nvm'
                if (process.platform === 'win32') {
                    const nvmHome = process.env['NVM_HOME'];
                    if (!nvmHome) {
                        return vscode.window.showErrorMessage(localize(2, null), { modal: true }).then(_ => {
                            return undefined; // abort launch
                        });
                    }
                    bin = path_1.join(nvmHome, `v${config.runtimeVersion}`);
                    versionManagerName = 'nvm-windows';
                }
                else {
                    let nvmHome = process.env['NVM_DIR'];
                    if (!nvmHome) {
                        // if NVM_DIR is not set. Probe for '.nvm' directory instead
                        const nvmDir = path_1.join(process.env['HOME'], '.nvm');
                        if (fs.existsSync(nvmDir)) {
                            nvmHome = nvmDir;
                        }
                    }
                    if (!nvmHome) {
                        return vscode.window.showErrorMessage(localize(3, null), { modal: true }).then(_ => {
                            return undefined; // abort launch
                        });
                    }
                    bin = path_1.join(nvmHome, 'versions', 'node', `v${config.runtimeVersion}`, 'bin');
                    versionManagerName = 'nvm';
                }
            }
            if (fs.existsSync(bin)) {
                if (!config.env) {
                    config.env = {};
                }
                if (process.platform === 'win32') {
                    config.env['Path'] = `${bin};${process.env['Path']}`;
                }
                else {
                    config.env['PATH'] = `${bin}:${process.env['PATH']}`;
                }
            }
            else {
                return vscode.window.showErrorMessage(localize(4, null, config.runtimeVersion, versionManagerName), { modal: true }).then(_ => {
                    return undefined; // abort launch
                });
            }
        }
        // is "auto attach child process" mode enabled?
        if (config.autoAttachChildProcesses) {
            childProcesses_1.prepareAutoAttachChildProcesses(config);
        }
        // determine which protocol to use
        return determineDebugType(config, this._extensionContext.logger).then(debugType => {
            if (debugType) {
                config.type = debugType;
            }
            return this.fixupLogParameters(config);
        });
    }
    fixupLogParameters(config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (config.trace && !config.logFilePath) {
                const fileName = config.type === 'node' ?
                    'debugadapter-legacy.txt' :
                    'debugadapter.txt';
                config.logFilePath = path_1.join(yield this._extensionContext.logger.logDirectory, fileName);
            }
            return config;
        });
    }
}
exports.NodeConfigurationProvider = NodeConfigurationProvider;
//---- helpers ----------------------------------------------------------------------------------------------------------------
function createLaunchConfigFromContext(folder, resolve, existingConfig) {
    const config = {
        type: 'node',
        request: 'launch',
        name: localize(5, null)
    };
    if (existingConfig && existingConfig.noDebug) {
        config['noDebug'] = true;
    }
    const pkg = loadJSON(folder, 'package.json');
    if (pkg && pkg.name === 'mern-starter') {
        if (resolve) {
            utilities_1.writeToConsole(localize(6, null, 'Mern Starter'));
        }
        configureMern(config);
    }
    else {
        let program;
        let useSourceMaps = false;
        if (pkg) {
            // try to find a value for 'program' by analysing package.json
            program = guessProgramFromPackage(folder, pkg, resolve);
            if (program && resolve) {
                utilities_1.writeToConsole(localize(7, null));
            }
        }
        if (!program) {
            // try to use file open in editor
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const languageId = editor.document.languageId;
                if (languageId === 'javascript' || isTranspiledLanguage(languageId)) {
                    const wf = vscode.workspace.getWorkspaceFolder(editor.document.uri);
                    if (wf === folder) {
                        program = vscode.workspace.asRelativePath(editor.document.uri);
                        if (!path_1.isAbsolute(program)) {
                            program = '${workspaceFolder}/' + program;
                        }
                    }
                }
                useSourceMaps = isTranspiledLanguage(languageId);
            }
        }
        // if we couldn't find a value for 'program', we just let the launch config use the file open in the editor
        if (!resolve && !program) {
            program = '${file}';
        }
        if (program) {
            config['program'] = program;
        }
        // prepare for source maps by adding 'outFiles' if typescript or coffeescript is detected
        if (useSourceMaps || vscode.workspace.textDocuments.some(document => isTranspiledLanguage(document.languageId))) {
            if (resolve) {
                utilities_1.writeToConsole(localize(8, null));
            }
            let dir = '';
            const tsConfig = loadJSON(folder, 'tsconfig.json');
            if (tsConfig && tsConfig.compilerOptions && tsConfig.compilerOptions.outDir) {
                const outDir = tsConfig.compilerOptions.outDir;
                if (!path_1.isAbsolute(outDir)) {
                    dir = outDir;
                    if (dir.indexOf('./') === 0) {
                        dir = dir.substr(2);
                    }
                    if (dir[dir.length - 1] !== '/') {
                        dir += '/';
                    }
                }
                config['preLaunchTask'] = 'tsc: build - tsconfig.json';
            }
            config['outFiles'] = ['${workspaceFolder}/' + dir + '**/*.js'];
        }
    }
    return config;
}
function loadJSON(folder, file) {
    if (folder) {
        try {
            const path = path_1.join(folder.uri.fsPath, file);
            const content = fs.readFileSync(path, 'utf8');
            return JSON.parse(content);
        }
        catch (error) {
            // silently ignore
        }
    }
    return undefined;
}
function configureMern(config) {
    config.protocol = 'inspector';
    config.runtimeExecutable = 'nodemon';
    config.program = '${workspaceFolder}/index.js';
    config.restart = true;
    config.env = {
        BABEL_DISABLE_CACHE: '1',
        NODE_ENV: 'development'
    };
    config.console = 'integratedTerminal';
    config.internalConsoleOptions = 'neverOpen';
}
function isTranspiledLanguage(languagId) {
    return languagId === 'typescript' || languagId === 'coffeescript';
}
/*
 * try to find the entry point ('main') from the package.json
 */
function guessProgramFromPackage(folder, packageJson, resolve) {
    let program;
    try {
        if (packageJson.main) {
            program = packageJson.main;
        }
        else if (packageJson.scripts && typeof packageJson.scripts.start === 'string') {
            // assume a start script of the form 'node server.js'
            program = packageJson.scripts.start.split(' ').pop();
        }
        if (program) {
            let path;
            if (path_1.isAbsolute(program)) {
                path = program;
            }
            else {
                path = folder ? path_1.join(folder.uri.fsPath, program) : undefined;
                program = path_1.join('${workspaceFolder}', program);
            }
            if (resolve && path && !fs.existsSync(path) && !fs.existsSync(path + '.js')) {
                return undefined;
            }
        }
    }
    catch (error) {
        // silently ignore
    }
    return program;
}
//---- debug type -------------------------------------------------------------------------------------------------------------
function determineDebugType(config, logger) {
    if (config.request === 'attach' && typeof config.processId === 'string') {
        return determineDebugTypeForPidConfig(config);
    }
    else if (config.protocol === 'legacy') {
        return Promise.resolve('node');
    }
    else if (config.protocol === 'inspector') {
        return Promise.resolve('node2');
    }
    else {
        // 'auto', or unspecified
        return protocolDetection_1.detectDebugType(config, logger);
    }
}
function determineDebugTypeForPidConfig(config) {
    const getPidP = isPickProcessCommand(config.processId) ?
        processPicker_1.pickProcess() :
        Promise.resolve(config.processId);
    return getPidP.then(pid => {
        if (pid && pid.match(/^[0-9]+$/)) {
            const pidNum = Number(pid);
            putPidInDebugMode(pidNum);
            return determineDebugTypeForPidInDebugMode(config, pidNum);
        }
        else {
            throw new Error(localize(9, null, pid));
        }
    }).then(debugType => {
        if (debugType) {
            // processID is handled, so turn this config into a normal port attach config
            config.processId = undefined;
            config.port = debugType === 'node2' ? protocolDetection_1.INSPECTOR_PORT_DEFAULT : protocolDetection_1.LEGACY_PORT_DEFAULT;
        }
        return debugType;
    });
}
function isPickProcessCommand(configProcessId) {
    configProcessId = configProcessId.trim();
    return configProcessId === '${command:PickProcess}' || configProcessId === '${command:extension.pickNodeProcess}';
}
function putPidInDebugMode(pid) {
    try {
        if (process.platform === 'win32') {
            // regular node has an undocumented API function for forcing another node process into debug mode.
            // 		(<any>process)._debugProcess(pid);
            // But since we are running on Electron's node, process._debugProcess doesn't work (for unknown reasons).
            // So we use a regular node instead:
            const command = `node -e process._debugProcess(${pid})`;
            child_process_1.execSync(command);
        }
        else {
            process.kill(pid, 'SIGUSR1');
        }
    }
    catch (e) {
        throw new Error(localize(10, null, pid, e));
    }
}
function determineDebugTypeForPidInDebugMode(config, pid) {
    let debugProtocolP;
    if (config.port === protocolDetection_1.INSPECTOR_PORT_DEFAULT) {
        debugProtocolP = Promise.resolve('inspector');
    }
    else if (config.port === protocolDetection_1.LEGACY_PORT_DEFAULT) {
        debugProtocolP = Promise.resolve('legacy');
    }
    else if (config.protocol) {
        debugProtocolP = Promise.resolve(config.protocol);
    }
    else {
        debugProtocolP = protocolDetection_1.detectProtocolForPid(pid);
    }
    return debugProtocolP.then(debugProtocol => {
        return debugProtocol === 'inspector' ? 'node2' :
            debugProtocol === 'legacy' ? 'node' :
                null;
    });
}
function nvsStandardArchName(arch) {
    switch (arch) {
        case '32':
        case 'x86':
        case 'ia32':
            return 'x86';
        case '64':
        case 'x64':
        case 'amd64':
            return 'x64';
        case 'arm':
            const arm_version = process.config.variables.arm_version;
            return arm_version ? 'armv' + arm_version + 'l' : 'arm';
        default:
            return arch;
    }
}
/**
 * Parses a node version string into remote name, semantic version, and architecture
 * components. Infers some unspecified components based on configuration.
 */
function parseVersionString(versionString) {
    const versionRegex = /^(([\w-]+)\/)?(v?(\d+(\.\d+(\.\d+)?)?))(\/((x86)|(32)|((x)?64)|(arm\w*)|(ppc\w*)))?$/i;
    const match = versionRegex.exec(versionString);
    if (!match) {
        throw new Error('Invalid version string: ' + versionString);
    }
    const nvsFormat = !!(match[2] || match[8]);
    const remoteName = match[2] || 'node';
    const semanticVersion = match[4] || '';
    const arch = nvsStandardArchName(match[8] || process.arch);
    return { nvsFormat, remoteName, semanticVersion, arch };
}

//# sourceMappingURL=../../../out/node/extension/configurationProvider.js.map
