"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const convert_1 = require("../utils/convert");
class TypeScriptReferenceSupport {
    constructor(client) {
        this.client = client;
    }
    async provideReferences(document, position, options, token) {
        const filepath = this.client.normalizePath(document.uri);
        if (!filepath) {
            return [];
        }
        const args = convert_1.vsPositionToTsFileLocation(filepath, position);
        try {
            const msg = await this.client.execute('references', args, token);
            if (!msg.body) {
                return [];
            }
            const result = [];
            const has203Features = this.client.apiVersion.has203Features();
            for (const ref of msg.body.refs) {
                if (!options.includeDeclaration && has203Features && ref.isDefinition) {
                    continue;
                }
                const url = this.client.asUrl(ref.file);
                const location = new vscode_1.Location(url, convert_1.tsTextSpanToVsRange(ref));
                result.push(location);
            }
            return result;
        }
        catch (_a) {
            return [];
        }
    }
}
exports.default = TypeScriptReferenceSupport;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/features\referenceProvider.js.map
