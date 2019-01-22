"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const nls = require("vscode-nls");
const convert_1 = require("../utils/convert");
const localize = nls.loadMessageBundle(__filename);
const configurationNamespace = 'jsDocCompletion';
var Configuration;
(function (Configuration) {
    Configuration.enabled = 'enabled';
})(Configuration || (Configuration = {}));
class JsDocCompletionItem extends vscode_1.CompletionItem {
    constructor(document, position, shouldGetJSDocFromTSServer) {
        super('/** */', vscode_1.CompletionItemKind.Snippet);
        this.detail = localize(0, null);
        this.insertText = '';
        this.sortText = '\0';
        const line = document.lineAt(position.line).text;
        const prefix = line.slice(0, position.character).match(/\/\**\s*$/);
        const suffix = line.slice(position.character).match(/^\s*\**\//);
        const start = position.translate(0, prefix ? -prefix[0].length : 0);
        this.range = new vscode_1.Range(start, position.translate(0, suffix ? suffix[0].length : 0));
        this.command = {
            title: 'Try Complete JSDoc',
            command: TryCompleteJsDocCommand.COMMAND_NAME,
            arguments: [document.uri, start, shouldGetJSDocFromTSServer]
        };
    }
}
class JsDocCompletionProvider {
    constructor(client, commandManager) {
        this.client = client;
        commandManager.register(new TryCompleteJsDocCommand(client));
    }
    async provideCompletionItems(document, position, token) {
        const file = this.client.normalizePath(document.uri);
        if (!file) {
            return [];
        }
        // TODO: unregister provider when disabled
        const enableJsDocCompletions = vscode_1.workspace.getConfiguration(configurationNamespace, document.uri).get(Configuration.enabled, true);
        if (!enableJsDocCompletions) {
            return [];
        }
        // Only show the JSdoc completion when the everything before the cursor is whitespace
        // or could be the opening of a comment
        const line = document.lineAt(position.line).text;
        const prefix = line.slice(0, position.character);
        if (prefix.match(/^\s*$|\/\*\*\s*$|^\s*\/\*\*+\s*$/) === null) {
            return [];
        }
        const args = {
            file
        };
        const response = await Promise.race([
            this.client.execute('navtree', args, token),
            new Promise((resolve) => setTimeout(resolve, 250))
        ]);
        if (!response || !response.body) {
            return [];
        }
        const body = response.body;
        function matchesPosition(tree) {
            if (!tree.spans.length) {
                return false;
            }
            const span = convert_1.tsTextSpanToVsRange(tree.spans[0]);
            if (position.line === span.start.line - 1 || position.line === span.start.line) {
                return true;
            }
            return tree.childItems ? tree.childItems.some(matchesPosition) : false;
        }
        if (!matchesPosition(body)) {
            return [];
        }
        return [new JsDocCompletionItem(document, position, enableJsDocCompletions)];
    }
    resolveCompletionItem(item, _token) {
        return item;
    }
}
exports.default = JsDocCompletionProvider;
class TryCompleteJsDocCommand {
    constructor(client) {
        this.client = client;
        this.id = TryCompleteJsDocCommand.COMMAND_NAME;
    }
    /**
     * Try to insert a jsdoc comment, using a template provide by typescript
     * if possible, otherwise falling back to a default comment format.
     */
    async execute(resource, start, shouldGetJSDocFromTSServer) {
        const file = this.client.normalizePath(resource);
        if (!file) {
            return false;
        }
        const editor = vscode_1.window.activeTextEditor;
        if (!editor || editor.document.uri.fsPath !== resource.fsPath) {
            return false;
        }
        if (!shouldGetJSDocFromTSServer) {
            return this.tryInsertDefaultDoc(editor, start);
        }
        const didInsertFromTemplate = await this.tryInsertJsDocFromTemplate(editor, file, start);
        if (didInsertFromTemplate) {
            return true;
        }
        return this.tryInsertDefaultDoc(editor, start);
    }
    async tryInsertJsDocFromTemplate(editor, file, position) {
        const snippet = await TryCompleteJsDocCommand.getSnippetTemplate(this.client, file, position);
        if (!snippet) {
            return false;
        }
        return editor.insertSnippet(snippet, position, { undoStopBefore: false, undoStopAfter: true });
    }
    static getSnippetTemplate(client, file, position) {
        const args = convert_1.vsPositionToTsFileLocation(file, position);
        return Promise.race([
            client.execute('docCommentTemplate', args),
            new Promise((_, reject) => setTimeout(reject, 250))
        ]).then((res) => {
            if (!res || !res.body) {
                return undefined;
            }
            // Workaround for #43619
            // docCommentTemplate previously returned undefined for empty jsdoc templates.
            // TS 2.7 now returns a single line doc comment, which breaks indentation.
            if (res.body.newText === '/** */') {
                return undefined;
            }
            return TryCompleteJsDocCommand.templateToSnippet(res.body.newText);
        }, () => undefined);
    }
    static templateToSnippet(template) {
        // TODO: use append placeholder
        let snippetIndex = 1;
        template = template.replace(/^\s*(?=(\/|[ ]\*))/gm, '');
        template = template.replace(/^(\/\*\*\s*\*[ ]*)$/m, (x) => x + `\$0`);
        template = template.replace(/\* @param([ ]\{\S+\})?\s+(\S+)\s*$/gm, (_param, type, post) => {
            let out = '* @param ';
            if (type === ' {any}' || type === ' {*}') {
                out += `{\$\{${snippetIndex++}:*\}} `;
            }
            else if (type) {
                out += type + ' ';
            }
            out += post + ` \${${snippetIndex++}}`;
            return out;
        });
        return new vscode_1.SnippetString(template);
    }
    /**
     * Insert the default JSDoc
     */
    tryInsertDefaultDoc(editor, position) {
        const snippet = new vscode_1.SnippetString(`/**\n * $0\n */`);
        return editor.insertSnippet(snippet, position, { undoStopBefore: false, undoStopAfter: true });
    }
}
TryCompleteJsDocCommand.COMMAND_NAME = '_typeScript.tryCompleteJsDoc';
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/features\jsDocCompletionProvider.js.map
