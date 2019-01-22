"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const previewer_1 = require("../utils/previewer");
const convert_1 = require("../utils/convert");
class TypeScriptHoverProvider {
    constructor(client) {
        this.client = client;
    }
    async provideHover(document, position, token) {
        const filepath = this.client.normalizePath(document.uri);
        if (!filepath) {
            return undefined;
        }
        const args = convert_1.vsPositionToTsFileLocation(filepath, position);
        try {
            const response = await this.client.execute('quickinfo', args, token);
            if (response && response.body) {
                const data = response.body;
                return new vscode_1.Hover(TypeScriptHoverProvider.getContents(data), convert_1.tsTextSpanToVsRange(data));
            }
        }
        catch (e) {
            // noop
        }
        return undefined;
    }
    static getContents(data) {
        const parts = [];
        if (data.displayString) {
            parts.push({ language: 'typescript', value: data.displayString });
        }
        const tags = previewer_1.tagsMarkdownPreview(data.tags);
        parts.push(data.documentation + (tags ? '\n\n' + tags : ''));
        return parts;
    }
}
exports.default = TypeScriptHoverProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/features\hoverProvider.js.map
