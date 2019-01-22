/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var languageModelCache_1 = require("../languageModelCache");
var vscode_html_languageservice_1 = require("vscode-html-languageservice");
var foldingProvider_proposed_1 = require("../protocol/foldingProvider.proposed");
function getHTMLMode(htmlLanguageService) {
    var globalSettings = {};
    var htmlDocuments = languageModelCache_1.getLanguageModelCache(10, 60, function (document) { return htmlLanguageService.parseHTMLDocument(document); });
    var completionParticipants = [];
    return {
        getId: function () {
            return 'html';
        },
        configure: function (options) {
            globalSettings = options;
        },
        doComplete: function (document, position, settings, registeredCompletionParticipants) {
            if (settings === void 0) { settings = globalSettings; }
            if (registeredCompletionParticipants) {
                completionParticipants = registeredCompletionParticipants;
            }
            var options = settings && settings.html && settings.html.suggest;
            var doAutoComplete = settings && settings.html && settings.html.autoClosingTags;
            if (doAutoComplete) {
                options.hideAutoCompleteProposals = true;
            }
            var htmlDocument = htmlDocuments.get(document);
            htmlLanguageService.setCompletionParticipants(completionParticipants);
            return htmlLanguageService.doComplete(document, position, htmlDocument, options);
        },
        setCompletionParticipants: function (registeredCompletionParticipants) {
            completionParticipants = registeredCompletionParticipants;
        },
        doHover: function (document, position) {
            return htmlLanguageService.doHover(document, position, htmlDocuments.get(document));
        },
        findDocumentHighlight: function (document, position) {
            return htmlLanguageService.findDocumentHighlights(document, position, htmlDocuments.get(document));
        },
        findDocumentLinks: function (document, documentContext) {
            return htmlLanguageService.findDocumentLinks(document, documentContext);
        },
        findDocumentSymbols: function (document) {
            return htmlLanguageService.findDocumentSymbols(document, htmlDocuments.get(document));
        },
        format: function (document, range, formatParams, settings) {
            if (settings === void 0) { settings = globalSettings; }
            var formatSettings = settings && settings.html && settings.html.format;
            if (formatSettings) {
                formatSettings = merge(formatSettings, {});
            }
            else {
                formatSettings = {};
            }
            if (formatSettings.contentUnformatted) {
                formatSettings.contentUnformatted = formatSettings.contentUnformatted + ',script';
            }
            else {
                formatSettings.contentUnformatted = 'script';
            }
            formatSettings = merge(formatParams, formatSettings);
            return htmlLanguageService.format(document, range, formatSettings);
        },
        getFoldingRanges: function (document) {
            var scanner = htmlLanguageService.createScanner(document.getText());
            var token = scanner.scan();
            var ranges = [];
            var stack = [];
            var elementNames = [];
            var lastTagName = null;
            var prevStart = -1;
            while (token !== vscode_html_languageservice_1.TokenType.EOS) {
                switch (token) {
                    case vscode_html_languageservice_1.TokenType.StartTagOpen: {
                        var startLine = document.positionAt(scanner.getTokenOffset()).line;
                        var range = { startLine: startLine, endLine: startLine };
                        stack.push(range);
                        break;
                    }
                    case vscode_html_languageservice_1.TokenType.StartTag: {
                        lastTagName = scanner.getTokenText();
                        elementNames.push(lastTagName);
                        break;
                    }
                    case vscode_html_languageservice_1.TokenType.EndTag: {
                        lastTagName = scanner.getTokenText();
                        break;
                    }
                    case vscode_html_languageservice_1.TokenType.EndTagClose:
                    case vscode_html_languageservice_1.TokenType.StartTagSelfClose: {
                        var name = elementNames.pop();
                        var range = stack.pop();
                        while (name && name !== lastTagName) {
                            name = elementNames.pop();
                            range = stack.pop();
                        }
                        var line = document.positionAt(scanner.getTokenOffset()).line;
                        if (range && line > range.startLine + 1 && prevStart !== range.startLine) {
                            range.endLine = line - 1;
                            ranges.push(range);
                            prevStart = range.startLine;
                        }
                        break;
                    }
                    case vscode_html_languageservice_1.TokenType.Comment: {
                        var text = scanner.getTokenText();
                        var m = text.match(/^\s*#(region\b)|(endregion\b)/);
                        if (m) {
                            var line = document.positionAt(scanner.getTokenOffset()).line;
                            if (m[1]) {
                                var range = { startLine: line, endLine: line, type: foldingProvider_proposed_1.FoldingRangeType.Region };
                                stack.push(range);
                                elementNames.push('');
                            }
                            else {
                                var i = stack.length - 1;
                                while (i >= 0 && stack[i].type !== foldingProvider_proposed_1.FoldingRangeType.Region) {
                                    i--;
                                }
                                if (i >= 0) {
                                    var range = stack[i];
                                    stack.length = i;
                                    if (line > range.startLine && prevStart !== range.startLine) {
                                        range.endLine = line;
                                        ranges.push(range);
                                        prevStart = range.startLine;
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
                token = scanner.scan();
            }
            return { ranges: ranges };
        },
        doAutoClose: function (document, position) {
            var offset = document.offsetAt(position);
            var text = document.getText();
            if (offset > 0 && text.charAt(offset - 1).match(/[>\/]/g)) {
                return htmlLanguageService.doTagComplete(document, position, htmlDocuments.get(document));
            }
            return null;
        },
        onDocumentRemoved: function (document) {
            htmlDocuments.onDocumentRemoved(document);
        },
        dispose: function () {
            htmlDocuments.dispose();
        }
    };
}
exports.getHTMLMode = getHTMLMode;
function merge(src, dst) {
    for (var key in src) {
        if (src.hasOwnProperty(key)) {
            dst[key] = src[key];
        }
    }
    return dst;
}
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\html\server\out/modes\htmlMode.js.map
