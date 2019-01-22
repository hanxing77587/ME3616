"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const preview_1 = require("./preview");
const dispose_1 = require("../util/dispose");
const topmostLineMonitor_1 = require("../util/topmostLineMonitor");
const file_1 = require("../util/file");
const previewConfig_1 = require("./previewConfig");
class MarkdownPreviewManager {
    constructor(contentProvider, logger) {
        this.contentProvider = contentProvider;
        this.logger = logger;
        this.topmostLineMonitor = new topmostLineMonitor_1.MarkdownFileTopmostLineMonitor();
        this.previewConfigurations = new previewConfig_1.MarkdownPreviewConfigurationManager();
        this.previews = [];
        this.activePreview = undefined;
        this.disposables = [];
        vscode.window.onDidChangeActiveEditor(editor => {
            vscode.commands.executeCommand('setContext', MarkdownPreviewManager.markdownPreviewActiveContextKey, editor && editor.editorType === 'webview' && editor.uri.scheme === preview_1.MarkdownPreview.previewScheme);
            this.activePreview = editor && editor.editorType === 'webview'
                ? this.previews.find(preview => editor.uri.toString() === preview.uri.toString())
                : undefined;
            if (editor && editor.editorType === 'texteditor') {
                if (file_1.isMarkdownFile(editor.document)) {
                    for (const preview of this.previews.filter(preview => !preview.locked)) {
                        preview.update(editor.document.uri);
                    }
                }
            }
        }, null, this.disposables);
    }
    dispose() {
        dispose_1.disposeAll(this.disposables);
        dispose_1.disposeAll(this.previews);
    }
    refresh() {
        for (const preview of this.previews) {
            preview.refresh();
        }
    }
    updateConfiguration() {
        for (const preview of this.previews) {
            preview.updateConfiguration();
        }
    }
    preview(resource, previewSettings) {
        let preview = this.getExistingPreview(resource, previewSettings);
        if (preview) {
            preview.show(previewSettings.previewColumn);
        }
        else {
            preview = this.createNewPreview(resource, previewSettings);
            this.previews.push(preview);
        }
        preview.update(resource);
    }
    get activePreviewResource() {
        return this.activePreview && this.activePreview.resource;
    }
    getResourceForPreview(previewUri) {
        const preview = this.getPreviewWithUri(previewUri);
        return preview && preview.resource;
    }
    toggleLock(previewUri) {
        const preview = previewUri ? this.getPreviewWithUri(previewUri) : this.activePreview;
        if (preview) {
            preview.toggleLock();
            // Close any previews that are now redundant, such as having two dynamic previews in the same editor group
            for (const otherPreview of this.previews) {
                if (otherPreview !== preview && preview.matches(otherPreview)) {
                    otherPreview.dispose();
                }
            }
        }
    }
    getExistingPreview(resource, previewSettings) {
        return this.previews.find(preview => preview.matchesResource(resource, previewSettings.previewColumn, previewSettings.locked));
    }
    getPreviewWithUri(previewUri) {
        return this.previews.find(preview => preview.uri.toString() === previewUri.toString());
    }
    createNewPreview(resource, previewSettings) {
        const preview = new preview_1.MarkdownPreview(resource, previewSettings.previewColumn, previewSettings.locked, this.contentProvider, this.previewConfigurations, this.logger, this.topmostLineMonitor);
        preview.onDispose(() => {
            const existing = this.previews.indexOf(preview);
            if (existing >= 0) {
                this.previews.splice(existing, 1);
            }
        });
        preview.onDidChangeViewColumn(() => {
            dispose_1.disposeAll(this.previews.filter(otherPreview => preview !== otherPreview && preview.matches(otherPreview)));
        });
        return preview;
    }
}
MarkdownPreviewManager.markdownPreviewActiveContextKey = 'markdownPreviewFocus';
exports.MarkdownPreviewManager = MarkdownPreviewManager;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\markdown\out/features\previewManager.js.map
