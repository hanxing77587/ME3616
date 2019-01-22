"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const languageModeIds = require("./languageModeIds");
/**
 * When clause context set when the current file is managed by vscode's built-in typescript extension.
 */
const isManagedFile_contextName = 'typescript.isManagedFile';
class ManagedFileContextManager {
    constructor(normalizePath) {
        this.normalizePath = normalizePath;
        this.isInManagedFileContext = false;
        this.onDidChangeActiveTextEditorSub = vscode.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor, this);
        this.onDidChangeActiveTextEditor(vscode.window.activeTextEditor);
    }
    dispose() {
        this.onDidChangeActiveTextEditorSub.dispose();
    }
    onDidChangeActiveTextEditor(editor) {
        if (editor) {
            const isManagedFile = isSupportedLanguageMode(editor.document) && this.normalizePath(editor.document.uri) !== null;
            this.updateContext(isManagedFile);
        }
    }
    updateContext(newValue) {
        if (newValue === this.isInManagedFileContext) {
            return;
        }
        vscode.commands.executeCommand('setContext', isManagedFile_contextName, newValue);
        this.isInManagedFileContext = newValue;
    }
}
exports.default = ManagedFileContextManager;
function isSupportedLanguageMode(doc) {
    return vscode.languages.match([languageModeIds.typescript, languageModeIds.typescriptreact, languageModeIds.javascript, languageModeIds.javascriptreact], doc) > 0;
}
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/utils\managedFileContext.js.map
