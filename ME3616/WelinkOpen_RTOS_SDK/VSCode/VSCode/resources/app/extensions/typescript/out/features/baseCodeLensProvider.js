"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const convert_1 = require("../utils/convert");
const regexp_1 = require("../utils/regexp");
class ReferencesCodeLens extends vscode_1.CodeLens {
    constructor(document, file, range) {
        super(range);
        this.document = document;
        this.file = file;
    }
}
exports.ReferencesCodeLens = ReferencesCodeLens;
class CachedNavTreeResponse {
    constructor() {
        this.version = -1;
        this.document = '';
    }
    execute(document, f) {
        if (this.matches(document)) {
            return this.response;
        }
        return this.update(document, f());
    }
    matches(document) {
        return this.version === document.version && this.document === document.uri.toString();
    }
    update(document, response) {
        this.response = response;
        this.version = document.version;
        this.document = document.uri.toString();
        return response;
    }
}
exports.CachedNavTreeResponse = CachedNavTreeResponse;
class TypeScriptBaseCodeLensProvider {
    constructor(client, cachedResponse) {
        this.client = client;
        this.cachedResponse = cachedResponse;
        this.enabled = true;
        this.onDidChangeCodeLensesEmitter = new vscode_1.EventEmitter();
    }
    get onDidChangeCodeLenses() {
        return this.onDidChangeCodeLensesEmitter.event;
    }
    setEnabled(enabled) {
        if (this.enabled !== enabled) {
            this.enabled = enabled;
            this.onDidChangeCodeLensesEmitter.fire();
        }
    }
    async provideCodeLenses(document, token) {
        if (!this.enabled) {
            return [];
        }
        const filepath = this.client.normalizePath(document.uri);
        if (!filepath) {
            return [];
        }
        try {
            const response = await this.cachedResponse.execute(document, () => this.client.execute('navtree', { file: filepath }, token));
            if (!response) {
                return [];
            }
            const tree = response.body;
            const referenceableSpans = [];
            if (tree && tree.childItems) {
                tree.childItems.forEach(item => this.walkNavTree(document, item, null, referenceableSpans));
            }
            return referenceableSpans.map(span => new ReferencesCodeLens(document.uri, filepath, span));
        }
        catch (_a) {
            return [];
        }
    }
    walkNavTree(document, item, parent, results) {
        if (!item) {
            return;
        }
        const range = this.extractSymbol(document, item, parent);
        if (range) {
            results.push(range);
        }
        (item.childItems || []).forEach(child => this.walkNavTree(document, child, item, results));
    }
    /**
     * TODO: TS currently requires the position for 'references 'to be inside of the identifer
     * Massage the range to make sure this is the case
     */
    getSymbolRange(document, item) {
        if (!item) {
            return null;
        }
        const span = item.spans && item.spans[0];
        if (!span) {
            return null;
        }
        const range = convert_1.tsTextSpanToVsRange(span);
        const text = document.getText(range);
        const identifierMatch = new RegExp(`^(.*?(\\b|\\W))${regexp_1.escapeRegExp(item.text || '')}(\\b|\\W)`, 'gm');
        const match = identifierMatch.exec(text);
        const prefixLength = match ? match.index + match[1].length : 0;
        const startOffset = document.offsetAt(new vscode_1.Position(range.start.line, range.start.character)) + prefixLength;
        return new vscode_1.Range(document.positionAt(startOffset), document.positionAt(startOffset + item.text.length));
    }
}
exports.TypeScriptBaseCodeLensProvider = TypeScriptBaseCodeLensProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/features\baseCodeLensProvider.js.map
