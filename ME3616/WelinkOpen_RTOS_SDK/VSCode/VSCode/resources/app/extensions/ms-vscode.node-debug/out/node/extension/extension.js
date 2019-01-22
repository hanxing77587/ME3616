/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const configurationProvider_1 = require("./configurationProvider");
const loadedScripts_1 = require("./loadedScripts");
const processPicker_1 = require("./processPicker");
const childProcesses_1 = require("./childProcesses");
function activate(context) {
    // register a configuration provider
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('node', new configurationProvider_1.NodeConfigurationProvider(context)));
    // toggle skipping file action
    context.subscriptions.push(vscode.commands.registerCommand('extension.node-debug.toggleSkippingFile', toggleSkippingFile));
    // process quickpicker
    context.subscriptions.push(vscode.commands.registerCommand('extension.pickNodeProcess', () => processPicker_1.pickProcess()));
    // loaded scripts
    vscode.window.registerTreeDataProvider('extension.node-debug.loadedScriptsExplorer', new loadedScripts_1.LoadedScriptsProvider(context));
    context.subscriptions.push(vscode.commands.registerCommand('extension.node-debug.pickLoadedScript', () => loadedScripts_1.pickLoadedScript()));
    context.subscriptions.push(vscode.commands.registerCommand('extension.node-debug.openScript', (session, source) => loadedScripts_1.openScript(session, source)));
    // cluster
    context.subscriptions.push(vscode.debug.onDidStartDebugSession(session => childProcesses_1.startSession(session)));
    context.subscriptions.push(vscode.debug.onDidTerminateDebugSession(session => childProcesses_1.stopSession(session)));
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//---- toggle skipped files
function toggleSkippingFile(res) {
    let resource = res;
    if (!resource) {
        const activeEditor = vscode.window.activeTextEditor;
        resource = activeEditor && activeEditor.document.fileName;
    }
    if (resource && vscode.debug.activeDebugSession) {
        const args = typeof resource === 'string' ? { resource } : { sourceReference: resource };
        vscode.debug.activeDebugSession.customRequest('toggleSkipFileStatus', args);
    }
}

//# sourceMappingURL=../../../out/node/extension/extension.js.map
