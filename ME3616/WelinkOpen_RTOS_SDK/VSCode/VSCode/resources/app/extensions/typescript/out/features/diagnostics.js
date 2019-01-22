"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class DiagnosticSet {
    constructor() {
        this._map = Object.create(null);
    }
    set(file, diagnostics) {
        this._map[this.key(file)] = diagnostics;
    }
    get(file) {
        return this._map[this.key(file)] || [];
    }
    clear() {
        this._map = Object.create(null);
    }
    key(file) {
        return file.toString(true);
    }
}
class DiagnosticsManager {
    constructor(language, client) {
        this.client = client;
        this._validate = true;
        this.syntaxDiagnostics = new DiagnosticSet();
        this.semanticDiagnostics = new DiagnosticSet();
        this.currentDiagnostics = vscode_1.languages.createDiagnosticCollection(language);
    }
    dispose() {
        this.currentDiagnostics.dispose();
    }
    reInitialize() {
        this.currentDiagnostics.clear();
        this.syntaxDiagnostics.clear();
        this.semanticDiagnostics.clear();
    }
    set validate(value) {
        if (this._validate === value) {
            return;
        }
        this._validate = value;
        if (!value) {
            this.currentDiagnostics.clear();
        }
    }
    syntaxDiagnosticsReceived(file, syntaxDiagnostics) {
        this.syntaxDiagnostics.set(file, syntaxDiagnostics);
        this.updateCurrentDiagnostics(file);
    }
    semanticDiagnosticsReceived(file, semanticDiagnostics) {
        this.semanticDiagnostics.set(file, semanticDiagnostics);
        this.updateCurrentDiagnostics(file);
    }
    configFileDiagnosticsReceived(file, diagnostics) {
        this.currentDiagnostics.set(file, diagnostics);
    }
    delete(file) {
        this.currentDiagnostics.delete(this.client.asUrl(file));
    }
    updateCurrentDiagnostics(file) {
        if (!this._validate) {
            return;
        }
        const semanticDiagnostics = this.semanticDiagnostics.get(file);
        const syntaxDiagnostics = this.syntaxDiagnostics.get(file);
        this.currentDiagnostics.set(file, semanticDiagnostics.concat(syntaxDiagnostics));
    }
    getDiagnostics(file) {
        return this.currentDiagnostics.get(file) || [];
    }
}
exports.default = DiagnosticsManager;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/features\diagnostics.js.map
