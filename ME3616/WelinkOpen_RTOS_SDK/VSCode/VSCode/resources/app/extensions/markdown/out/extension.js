"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const markdownEngine_1 = require("./markdownEngine");
const security_1 = require("./security");
const logger_1 = require("./logger");
const commandManager_1 = require("./commandManager");
const commands = require("./commands/index");
const telemetryReporter_1 = require("./telemetryReporter");
const markdownExtensions_1 = require("./markdownExtensions");
const documentLinkProvider_1 = require("./features/documentLinkProvider");
const documentSymbolProvider_1 = require("./features/documentSymbolProvider");
const previewContentProvider_1 = require("./features/previewContentProvider");
const previewManager_1 = require("./features/previewManager");
function activate(context) {
    const telemetryReporter = telemetryReporter_1.loadDefaultTelemetryReporter();
    context.subscriptions.push(telemetryReporter);
    const cspArbiter = new security_1.ExtensionContentSecurityPolicyArbiter(context.globalState, context.workspaceState);
    const engine = new markdownEngine_1.MarkdownEngine();
    const logger = new logger_1.Logger();
    const selector = 'markdown';
    const contentProvider = new previewContentProvider_1.MarkdownContentProvider(engine, context, cspArbiter, logger);
    markdownExtensions_1.loadMarkdownExtensions(contentProvider, engine);
    const previewManager = new previewManager_1.MarkdownPreviewManager(contentProvider, logger);
    context.subscriptions.push(previewManager);
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(selector, new documentSymbolProvider_1.default(engine)));
    context.subscriptions.push(vscode.languages.registerDocumentLinkProvider(selector, new documentLinkProvider_1.default()));
    const previewSecuritySelector = new security_1.PreviewSecuritySelector(cspArbiter, previewManager);
    const commandManager = new commandManager_1.CommandManager();
    context.subscriptions.push(commandManager);
    commandManager.register(new commands.ShowPreviewCommand(previewManager, telemetryReporter));
    commandManager.register(new commands.ShowPreviewToSideCommand(previewManager, telemetryReporter));
    commandManager.register(new commands.ShowLockedPreviewToSideCommand(previewManager, telemetryReporter));
    commandManager.register(new commands.ShowSourceCommand(previewManager));
    commandManager.register(new commands.RefreshPreviewCommand(previewManager));
    commandManager.register(new commands.MoveCursorToPositionCommand());
    commandManager.register(new commands.ShowPreviewSecuritySelectorCommand(previewSecuritySelector, previewManager));
    commandManager.register(new commands.OnPreviewStyleLoadErrorCommand());
    commandManager.register(new commands.OpenDocumentLinkCommand(engine));
    commandManager.register(new commands.ToggleLockCommand(previewManager));
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
        logger.updateConfiguration();
        previewManager.updateConfiguration();
    }));
}
exports.activate = activate;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\markdown\out/extension.js.map
