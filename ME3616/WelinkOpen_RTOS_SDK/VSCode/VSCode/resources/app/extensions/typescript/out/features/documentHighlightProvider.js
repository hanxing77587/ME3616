"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const convert_1 = require("../utils/convert");
const stringDelimiters = ['"', '\'', '`'];
class TypeScriptDocumentHighlightProvider {
    constructor(client) {
        this.client = client;
    }
    async provideDocumentHighlights(resource, position, token) {
        const filepath = this.client.normalizePath(resource.uri);
        if (!filepath) {
            return [];
        }
        const args = convert_1.vsPositionToTsFileLocation(filepath, position);
        try {
            const response = await this.client.execute('occurrences', args, token);
            const data = response.body;
            if (data && data.length) {
                // Workaround for https://github.com/Microsoft/TypeScript/issues/12780
                // Don't highlight string occurrences
                const firstOccurrence = data[0];
                if (this.client.apiVersion.has213Features() && firstOccurrence.start.offset > 1) {
                    // Check to see if contents around first occurrence are string delimiters
                    const contents = resource.getText(new vscode_1.Range(firstOccurrence.start.line - 1, firstOccurrence.start.offset - 1 - 1, firstOccurrence.end.line - 1, firstOccurrence.end.offset - 1 + 1));
                    if (contents && contents.length > 2 && stringDelimiters.indexOf(contents[0]) >= 0 && contents[0] === contents[contents.length - 1]) {
                        return [];
                    }
                }
                return data.map(item => new vscode_1.DocumentHighlight(convert_1.tsTextSpanToVsRange(item), item.isWriteAccess ? vscode_1.DocumentHighlightKind.Write : vscode_1.DocumentHighlightKind.Read));
            }
            return [];
        }
        catch (_a) {
            return [];
        }
    }
}
exports.default = TypeScriptDocumentHighlightProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/features\documentHighlightProvider.js.map
