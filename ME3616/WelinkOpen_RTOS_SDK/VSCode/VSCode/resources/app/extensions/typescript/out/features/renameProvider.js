"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const convert_1 = require("../utils/convert");
class TypeScriptRenameProvider {
    constructor(client) {
        this.client = client;
    }
    async provideRenameEdits(document, position, newName, token) {
        const filepath = this.client.normalizePath(document.uri);
        if (!filepath) {
            return null;
        }
        const args = Object.assign({}, convert_1.vsPositionToTsFileLocation(filepath, position), { findInStrings: false, findInComments: false });
        try {
            const response = await this.client.execute('rename', args, token);
            const renameResponse = response.body;
            if (!renameResponse) {
                return null;
            }
            const renameInfo = renameResponse.info;
            if (!renameInfo.canRename) {
                return Promise.reject(renameInfo.localizedErrorMessage);
            }
            const result = new vscode_1.WorkspaceEdit();
            for (const spanGroup of renameResponse.locs) {
                const resource = this.client.asUrl(spanGroup.file);
                if (!resource) {
                    continue;
                }
                for (const textSpan of spanGroup.locs) {
                    result.replace(resource, convert_1.tsTextSpanToVsRange(textSpan), newName);
                }
            }
            return result;
        }
        catch (e) {
            // noop
        }
        return null;
    }
}
exports.default = TypeScriptRenameProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/features\renameProvider.js.map
