"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const languageIds = require("../utils/languageModeIds");
var FormattingConfiguration;
(function (FormattingConfiguration) {
    function equals(a, b) {
        let keys = Object.keys(a);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            if (a[key] !== b[key]) {
                return false;
            }
        }
        return true;
    }
    FormattingConfiguration.equals = equals;
})(FormattingConfiguration || (FormattingConfiguration = {}));
class FormattingConfigurationManager {
    constructor(client) {
        this.client = client;
        this.formatOptions = Object.create(null);
        this.onDidCloseTextDocumentSub = vscode_1.workspace.onDidCloseTextDocument((textDocument) => {
            const key = textDocument.uri.toString();
            // When a document gets closed delete the cached formatting options.
            // This is necessary since the tsserver now closed a project when its
            // last file in it closes which drops the stored formatting options
            // as well.
            delete this.formatOptions[key];
        });
    }
    dispose() {
        if (this.onDidCloseTextDocumentSub) {
            this.onDidCloseTextDocumentSub.dispose();
            this.onDidCloseTextDocumentSub = undefined;
        }
    }
    async ensureFormatOptionsForDocument(document, token) {
        const editor = vscode_1.window.visibleTextEditors.find(editor => editor.document.fileName === document.fileName);
        if (editor) {
            const formattingOptions = {
                tabSize: editor.options.tabSize,
                insertSpaces: editor.options.insertSpaces
            };
            return this.ensureFormatOptions(document, formattingOptions, token);
        }
    }
    async ensureFormatOptions(document, options, token) {
        const file = this.client.normalizePath(document.uri);
        if (!file) {
            return;
        }
        const key = document.uri.toString();
        const cachedOptions = this.formatOptions[key];
        const formatOptions = this.getFormatOptions(document, options);
        if (cachedOptions && FormattingConfiguration.equals(cachedOptions, formatOptions)) {
            return;
        }
        const args = {
            file: file,
            formatOptions: formatOptions
        };
        await this.client.execute('configure', args, token);
        this.formatOptions[key] = formatOptions;
    }
    reset() {
        this.formatOptions = Object.create(null);
    }
    getFormatOptions(document, options) {
        const config = vscode_1.workspace.getConfiguration(document.languageId === languageIds.typescript || document.languageId === languageIds.typescriptreact
            ? 'typescript.format'
            : 'javascript.format', document.uri);
        return {
            tabSize: options.tabSize,
            indentSize: options.tabSize,
            convertTabsToSpaces: options.insertSpaces,
            // We can use \n here since the editor normalizes later on to its line endings.
            newLineCharacter: '\n',
            insertSpaceAfterCommaDelimiter: config.get('insertSpaceAfterCommaDelimiter'),
            insertSpaceAfterConstructor: config.get('insertSpaceAfterConstructor'),
            insertSpaceAfterSemicolonInForStatements: config.get('insertSpaceAfterSemicolonInForStatements'),
            insertSpaceBeforeAndAfterBinaryOperators: config.get('insertSpaceBeforeAndAfterBinaryOperators'),
            insertSpaceAfterKeywordsInControlFlowStatements: config.get('insertSpaceAfterKeywordsInControlFlowStatements'),
            insertSpaceAfterFunctionKeywordForAnonymousFunctions: config.get('insertSpaceAfterFunctionKeywordForAnonymousFunctions'),
            insertSpaceBeforeFunctionParenthesis: config.get('insertSpaceBeforeFunctionParenthesis'),
            insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: config.get('insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis'),
            insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: config.get('insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets'),
            insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: config.get('insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces'),
            insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: config.get('insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces'),
            insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: config.get('insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces'),
            insertSpaceAfterTypeAssertion: config.get('insertSpaceAfterTypeAssertion'),
            placeOpenBraceOnNewLineForFunctions: config.get('placeOpenBraceOnNewLineForFunctions'),
            placeOpenBraceOnNewLineForControlBlocks: config.get('placeOpenBraceOnNewLineForControlBlocks'),
        };
    }
}
exports.default = FormattingConfigurationManager;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/features\formattingConfigurationManager.js.map
