"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const PConst = require("../protocol.const");
const baseCodeLensProvider_1 = require("./baseCodeLensProvider");
const convert_1 = require("../utils/convert");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle(__filename);
class TypeScriptReferencesCodeLensProvider extends baseCodeLensProvider_1.TypeScriptBaseCodeLensProvider {
    constructor(client, language, cachedResponse) {
        super(client, cachedResponse);
        this.language = language;
    }
    updateConfiguration() {
        const config = vscode_1.workspace.getConfiguration(this.language);
        this.setEnabled(config.get('referencesCodeLens.enabled', false));
    }
    async provideCodeLenses(document, token) {
        if (!this.client.apiVersion.has206Features()) {
            return [];
        }
        return super.provideCodeLenses(document, token);
    }
    resolveCodeLens(inputCodeLens, token) {
        const codeLens = inputCodeLens;
        const args = convert_1.vsPositionToTsFileLocation(codeLens.file, codeLens.range.start);
        return this.client.execute('references', args, token).then(response => {
            if (!response || !response.body) {
                throw codeLens;
            }
            const locations = response.body.refs
                .map(reference => new vscode_1.Location(this.client.asUrl(reference.file), convert_1.tsTextSpanToVsRange(reference)))
                .filter(location => 
            // Exclude original definition from references
            !(location.uri.toString() === codeLens.document.toString() &&
                location.range.start.isEqual(codeLens.range.start)));
            codeLens.command = {
                title: locations.length === 1
                    ? localize(0, null)
                    : localize(1, null, locations.length),
                command: locations.length ? 'editor.action.showReferences' : '',
                arguments: [codeLens.document, codeLens.range.start, locations]
            };
            return codeLens;
        }).catch(() => {
            codeLens.command = {
                title: localize(2, null),
                command: ''
            };
            return codeLens;
        });
    }
    extractSymbol(document, item, parent) {
        if (parent && parent.kind === PConst.Kind.enum) {
            return super.getSymbolRange(document, item);
        }
        switch (item.kind) {
            case PConst.Kind.const:
            case PConst.Kind.let:
            case PConst.Kind.variable:
            case PConst.Kind.function:
                // Only show references for exported variables
                if (!item.kindModifiers.match(/\bexport\b/)) {
                    break;
                }
            // fallthrough
            case PConst.Kind.class:
                if (item.text === '<class>') {
                    break;
                }
            // fallthrough
            case PConst.Kind.memberFunction:
            case PConst.Kind.memberVariable:
            case PConst.Kind.memberGetAccessor:
            case PConst.Kind.memberSetAccessor:
            case PConst.Kind.constructorImplementation:
            case PConst.Kind.interface:
            case PConst.Kind.type:
            case PConst.Kind.enum:
                return super.getSymbolRange(document, item);
        }
        return null;
    }
}
exports.default = TypeScriptReferencesCodeLensProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/features\referencesCodeLensProvider.js.map
