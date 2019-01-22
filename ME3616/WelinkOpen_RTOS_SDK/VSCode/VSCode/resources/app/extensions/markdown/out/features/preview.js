"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const dispose_1 = require("../util/dispose");
const nls = require("vscode-nls");
const topmostLineMonitor_1 = require("../util/topmostLineMonitor");
const localize = nls.loadMessageBundle(__filename);
class MarkdownPreview {
    constructor(_resource, previewColumn, locked, contentProvider, previewConfigurations, logger, topmostLineMonitor) {
        this._resource = _resource;
        this.locked = locked;
        this.contentProvider = contentProvider;
        this.previewConfigurations = previewConfigurations;
        this.logger = logger;
        this.initialLine = undefined;
        this.disposables = [];
        this.firstUpdate = true;
        this.forceUpdate = false;
        this.isScrolling = false;
        this._onDisposeEmitter = new vscode.EventEmitter();
        this.onDispose = this._onDisposeEmitter.event;
        this._onDidChangeViewColumnEmitter = new vscode.EventEmitter();
        this.onDidChangeViewColumn = this._onDidChangeViewColumnEmitter.event;
        this.uri = vscode.Uri.parse(`${MarkdownPreview.previewScheme}:${MarkdownPreview.previewCount++}`);
        this.webview = vscode.window.createWebview(this.uri, this.getPreviewTitle(this._resource), previewColumn, {
            enableScripts: true,
            enableCommandUris: true,
            localResourceRoots: this.getLocalResourceRoots(_resource)
        });
        this.webview.onDidDispose(() => {
            this.dispose();
        }, null, this.disposables);
        this.webview.onDidChangeViewColumn(() => {
            this._onDidChangeViewColumnEmitter.fire();
        }, null, this.disposables);
        this.webview.onDidReceiveMessage(e => {
            if (e.source !== this._resource.toString()) {
                return;
            }
            switch (e.type) {
                case 'command':
                    vscode.commands.executeCommand(e.body.command, ...e.body.args);
                    break;
                case 'revealLine':
                    this.onDidScrollPreview(e.body.line);
                    break;
                case 'didClick':
                    this.onDidClickPreview(e.body.line);
                    break;
            }
        }, null, this.disposables);
        vscode.workspace.onDidChangeTextDocument(event => {
            if (this.isPreviewOf(event.document.uri)) {
                this.refresh();
            }
        }, null, this.disposables);
        topmostLineMonitor.onDidChangeTopmostLine(event => {
            if (this.isPreviewOf(event.resource)) {
                this.updateForView(event.resource, event.line);
            }
        }, null, this.disposables);
        vscode.window.onDidChangeTextEditorSelection(event => {
            if (this.isPreviewOf(event.textEditor.document.uri)) {
                this.webview.postMessage({
                    type: 'onDidChangeTextEditorSelection',
                    line: event.selections[0].active.line,
                    source: this.resource.toString()
                });
            }
        }, null, this.disposables);
    }
    get resource() {
        return this._resource;
    }
    dispose() {
        this._onDisposeEmitter.fire();
        this._onDisposeEmitter.dispose();
        this._onDidChangeViewColumnEmitter.dispose();
        this.webview.dispose();
        dispose_1.disposeAll(this.disposables);
    }
    update(resource) {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.uri.fsPath === resource.fsPath) {
            this.initialLine = topmostLineMonitor_1.getVisibleLine(editor);
        }
        else {
            this.initialLine = undefined;
        }
        // If we have changed resources, cancel any pending updates
        const isResourceChange = resource.fsPath !== this._resource.fsPath;
        if (isResourceChange) {
            clearTimeout(this.throttleTimer);
            this.throttleTimer = undefined;
        }
        this._resource = resource;
        // Schedule update if none is pending
        if (!this.throttleTimer) {
            if (isResourceChange || this.firstUpdate) {
                this.doUpdate();
            }
            else {
                this.throttleTimer = setTimeout(() => this.doUpdate(), 300);
            }
        }
        this.firstUpdate = false;
    }
    refresh() {
        this.forceUpdate = true;
        this.update(this._resource);
    }
    updateConfiguration() {
        if (this.previewConfigurations.hasConfigurationChanged(this._resource)) {
            this.refresh();
        }
    }
    get viewColumn() {
        return this.webview.viewColumn;
    }
    isPreviewOf(resource) {
        return this._resource.fsPath === resource.fsPath;
    }
    matchesResource(otherResource, otherViewColumn, otherLocked) {
        if (this.viewColumn !== otherViewColumn) {
            return false;
        }
        if (this.locked) {
            return otherLocked && this.isPreviewOf(otherResource);
        }
        else {
            return !otherLocked;
        }
    }
    matches(otherPreview) {
        return this.matchesResource(otherPreview._resource, otherPreview.viewColumn, otherPreview.locked);
    }
    show(viewColumn) {
        this.webview.show(viewColumn);
    }
    toggleLock() {
        this.locked = !this.locked;
        this.webview.title = this.getPreviewTitle(this._resource);
    }
    getPreviewTitle(resource) {
        return this.locked
            ? localize(0, null, path.basename(resource.fsPath))
            : localize(1, null, path.basename(resource.fsPath));
    }
    updateForView(resource, topLine) {
        if (!this.isPreviewOf(resource)) {
            return;
        }
        if (this.isScrolling) {
            this.isScrolling = false;
            return;
        }
        if (typeof topLine === 'number') {
            this.logger.log('updateForView', { markdownFile: resource });
            this.initialLine = topLine;
            this.webview.postMessage({
                type: 'updateView',
                line: topLine,
                source: resource.toString()
            });
        }
    }
    async doUpdate() {
        const resource = this._resource;
        clearTimeout(this.throttleTimer);
        this.throttleTimer = undefined;
        const document = await vscode.workspace.openTextDocument(resource);
        if (!this.forceUpdate && this.currentVersion && this.currentVersion.resource.fsPath === resource.fsPath && this.currentVersion.version === document.version) {
            if (this.initialLine) {
                this.updateForView(resource, this.initialLine);
            }
            return;
        }
        this.forceUpdate = false;
        this.currentVersion = { resource, version: document.version };
        this.contentProvider.provideTextDocumentContent(document, this.previewConfigurations, this.initialLine)
            .then(content => {
            if (this._resource === resource) {
                this.webview.title = this.getPreviewTitle(this._resource);
                this.webview.html = content;
            }
        });
    }
    getLocalResourceRoots(resource) {
        const folder = vscode.workspace.getWorkspaceFolder(resource);
        if (folder) {
            return [folder.uri];
        }
        if (!resource.scheme || resource.scheme === 'file') {
            return [vscode.Uri.file(path.dirname(resource.fsPath))];
        }
        return [];
    }
    onDidScrollPreview(line) {
        for (const editor of vscode.window.visibleTextEditors) {
            if (!this.isPreviewOf(editor.document.uri)) {
                continue;
            }
            this.isScrolling = true;
            const sourceLine = Math.floor(line);
            const fraction = line - sourceLine;
            const text = editor.document.lineAt(sourceLine).text;
            const start = Math.floor(fraction * text.length);
            editor.revealRange(new vscode.Range(sourceLine, start, sourceLine + 1, 0), vscode.TextEditorRevealType.AtTop);
        }
    }
    async onDidClickPreview(line) {
        for (const visibleEditor of vscode.window.visibleTextEditors) {
            if (this.isPreviewOf(visibleEditor.document.uri)) {
                const editor = await vscode.window.showTextDocument(visibleEditor.document, visibleEditor.viewColumn);
                const position = new vscode.Position(line, 0);
                editor.selection = new vscode.Selection(position, position);
                return;
            }
        }
    }
}
MarkdownPreview.previewScheme = 'vscode-markdown-preview';
MarkdownPreview.previewCount = 0;
exports.MarkdownPreview = MarkdownPreview;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\markdown\out/features\preview.js.map
