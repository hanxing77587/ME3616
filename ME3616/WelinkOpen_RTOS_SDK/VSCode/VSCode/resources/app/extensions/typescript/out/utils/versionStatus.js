"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const languageModeIds = require("./languageModeIds");
class VersionStatus {
    constructor(normalizePath) {
        this.normalizePath = normalizePath;
        this.versionBarEntry = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99 /* to the right of editor status (100) */);
        this.onChangeEditorSub = vscode.window.onDidChangeActiveTextEditor(this.showHideStatus, this);
    }
    dispose() {
        this.versionBarEntry.dispose();
        this.onChangeEditorSub.dispose();
    }
    onDidChangeTypeScriptVersion(version) {
        this.showHideStatus();
        this.versionBarEntry.text = version.versionString;
        this.versionBarEntry.tooltip = version.path;
        this.versionBarEntry.command = 'typescript.selectTypeScriptVersion';
    }
    showHideStatus() {
        if (!vscode.window.activeTextEditor) {
            this.versionBarEntry.hide();
            return;
        }
        const doc = vscode.window.activeTextEditor.document;
        if (vscode.languages.match([languageModeIds.typescript, languageModeIds.typescriptreact], doc)) {
            if (this.normalizePath(doc.uri)) {
                this.versionBarEntry.show();
            }
            else {
                this.versionBarEntry.hide();
            }
            return;
        }
        if (!vscode.window.activeTextEditor.viewColumn) {
            // viewColumn is undefined for the debug/output panel, but we still want
            // to show the version info in the existing editor
            return;
        }
        this.versionBarEntry.hide();
    }
}
exports.default = VersionStatus;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/utils\versionStatus.js.map
