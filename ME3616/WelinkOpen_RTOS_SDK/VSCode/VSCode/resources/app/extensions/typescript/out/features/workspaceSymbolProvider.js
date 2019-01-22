"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const convert_1 = require("../utils/convert");
function getSymbolKind(item) {
    switch (item.kind) {
        case 'method': return vscode_1.SymbolKind.Method;
        case 'enum': return vscode_1.SymbolKind.Enum;
        case 'function': return vscode_1.SymbolKind.Function;
        case 'class': return vscode_1.SymbolKind.Class;
        case 'interface': return vscode_1.SymbolKind.Interface;
        case 'var': return vscode_1.SymbolKind.Variable;
        default: return vscode_1.SymbolKind.Variable;
    }
}
class TypeScriptWorkspaceSymbolProvider {
    constructor(client, modeIds) {
        this.client = client;
        this.modeIds = modeIds;
    }
    async provideWorkspaceSymbols(search, token) {
        // typescript wants to have a resource even when asking
        // general questions so we check the active editor. If this
        // doesn't match we take the first TS document.
        let uri = undefined;
        const editor = vscode_1.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            if (document && this.modeIds.indexOf(document.languageId) >= 0) {
                uri = document.uri;
            }
        }
        if (!uri) {
            const documents = vscode_1.workspace.textDocuments;
            for (const document of documents) {
                if (this.modeIds.indexOf(document.languageId) >= 0) {
                    uri = document.uri;
                    break;
                }
            }
        }
        if (!uri) {
            return [];
        }
        const filepath = this.client.normalizePath(uri);
        if (!filepath) {
            return [];
        }
        const args = {
            file: filepath,
            searchValue: search
        };
        const response = await this.client.execute('navto', args, token);
        if (!response.body) {
            return [];
        }
        const result = [];
        for (const item of response.body) {
            if (!item.containerName && item.kind === 'alias') {
                continue;
            }
            const range = convert_1.tsTextSpanToVsRange(item);
            const label = TypeScriptWorkspaceSymbolProvider.getLabel(item);
            result.push(new vscode_1.SymbolInformation(label, getSymbolKind(item), item.containerName || '', new vscode_1.Location(this.client.asUrl(item.file), range)));
        }
        return result;
    }
    static getLabel(item) {
        let label = item.name;
        if (item.kind === 'method' || item.kind === 'function') {
            label += '()';
        }
        return label;
    }
}
exports.default = TypeScriptWorkspaceSymbolProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/features\workspaceSymbolProvider.js.map
