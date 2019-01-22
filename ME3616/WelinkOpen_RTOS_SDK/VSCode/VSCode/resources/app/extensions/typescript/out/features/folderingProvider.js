"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class TypeScriptFoldingProvider {
    constructor(client) {
        this.client = client;
    }
    async provideFoldingRanges(document, token) {
        if (!this.client.apiVersion.has270Features()) {
            return;
        }
        const file = this.client.normalizePath(document.uri);
        if (!file) {
            return;
        }
        const args = { file };
        const response = await this.client.execute('outliningSpans', args, token);
        if (!response || !response.body) {
            return;
        }
        return new vscode.FoldingRangeList(response.body.map(span => {
            const start = document.positionAt(span.textSpan.start);
            const end = document.positionAt(span.textSpan.start + span.textSpan.length);
            return new vscode.FoldingRange(start.line, end.line);
        }));
    }
}
exports.default = TypeScriptFoldingProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/features\folderingProvider.js.map
