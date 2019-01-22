/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode_1 = require("vscode");
var phpGlobals = require("./phpGlobals");
var markedTextUtil_1 = require("./utils/markedTextUtil");
var PHPHoverProvider = /** @class */ (function () {
    function PHPHoverProvider() {
    }
    PHPHoverProvider.prototype.provideHover = function (document, position, _token) {
        var enable = vscode_1.workspace.getConfiguration('php').get('suggest.basic', true);
        if (!enable) {
            return undefined;
        }
        var wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }
        var name = document.getText(wordRange);
        var entry = phpGlobals.globalfunctions[name] || phpGlobals.compiletimeconstants[name] || phpGlobals.globalvariables[name] || phpGlobals.keywords[name];
        if (entry && entry.description) {
            var signature = name + (entry.signature || '');
            var contents = [markedTextUtil_1.textToMarkedString(entry.description), { language: 'php', value: signature }];
            return new vscode_1.Hover(contents, wordRange);
        }
        return undefined;
    };
    return PHPHoverProvider;
}());
exports.default = PHPHoverProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\php\out/features\hoverProvider.js.map
