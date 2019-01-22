/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode_languageserver_1 = require("vscode-languageserver");
var protocol_colorProvider_proposed_1 = require("vscode-languageserver-protocol/lib/protocol.colorProvider.proposed");
var request_light_1 = require("request-light");
var fs = require("fs");
var vscode_uri_1 = require("vscode-uri");
var URL = require("url");
var Strings = require("./utils/strings");
var errors_1 = require("./utils/errors");
var vscode_json_languageservice_1 = require("vscode-json-languageservice");
var languageModelCache_1 = require("./languageModelCache");
var jsonc_parser_1 = require("jsonc-parser");
var foldingProvider_proposed_1 = require("./protocol/foldingProvider.proposed");
var SchemaAssociationNotification;
(function (SchemaAssociationNotification) {
    SchemaAssociationNotification.type = new vscode_languageserver_1.NotificationType('json/schemaAssociations');
})(SchemaAssociationNotification || (SchemaAssociationNotification = {}));
var VSCodeContentRequest;
(function (VSCodeContentRequest) {
    VSCodeContentRequest.type = new vscode_languageserver_1.RequestType('vscode/content');
})(VSCodeContentRequest || (VSCodeContentRequest = {}));
var SchemaContentChangeNotification;
(function (SchemaContentChangeNotification) {
    SchemaContentChangeNotification.type = new vscode_languageserver_1.NotificationType('json/schemaContent');
})(SchemaContentChangeNotification || (SchemaContentChangeNotification = {}));
// Create a connection for the server
var connection = vscode_languageserver_1.createConnection();
process.on('unhandledRejection', function (e) {
    connection.console.error(errors_1.formatError("Unhandled exception", e));
});
console.log = connection.console.log.bind(connection.console);
console.error = connection.console.error.bind(connection.console);
// Create a simple text document manager. The text document manager
// supports full document sync only
var documents = new vscode_languageserver_1.TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
var clientSnippetSupport = false;
var clientDynamicRegisterSupport = false;
// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities.
connection.onInitialize(function (params) {
    function hasClientCapability() {
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            keys[_i] = arguments[_i];
        }
        var c = params.capabilities;
        for (var i = 0; c && i < keys.length; i++) {
            c = c[keys[i]];
        }
        return !!c;
    }
    clientSnippetSupport = hasClientCapability('textDocument', 'completion', 'completionItem', 'snippetSupport');
    clientDynamicRegisterSupport = hasClientCapability('workspace', 'symbol', 'dynamicRegistration');
    var capabilities = {
        // Tell the client that the server works in FULL text document sync mode
        textDocumentSync: documents.syncKind,
        completionProvider: clientSnippetSupport ? { resolveProvider: true, triggerCharacters: ['"', ':'] } : void 0,
        hoverProvider: true,
        documentSymbolProvider: true,
        documentRangeFormattingProvider: false,
        colorProvider: true,
        foldingProvider: true
    };
    return { capabilities: capabilities };
});
var workspaceContext = {
    resolveRelativePath: function (relativePath, resource) {
        return URL.resolve(resource, relativePath);
    }
};
var schemaRequestService = function (uri) {
    if (Strings.startsWith(uri, 'file://')) {
        var fsPath_1 = vscode_uri_1.default.parse(uri).fsPath;
        return new Promise(function (c, e) {
            fs.readFile(fsPath_1, 'UTF-8', function (err, result) {
                err ? e('') : c(result.toString());
            });
        });
    }
    else if (Strings.startsWith(uri, 'vscode://')) {
        return connection.sendRequest(VSCodeContentRequest.type, uri).then(function (responseText) {
            return responseText;
        }, function (error) {
            return Promise.reject(error.message);
        });
    }
    if (uri.indexOf('//schema.management.azure.com/') !== -1) {
        connection.telemetry.logEvent({
            key: 'json.schema',
            value: {
                schemaURL: uri
            }
        });
    }
    var headers = { 'Accept-Encoding': 'gzip, deflate' };
    return request_light_1.xhr({ url: uri, followRedirects: 5, headers: headers }).then(function (response) {
        return response.responseText;
    }, function (error) {
        return Promise.reject(error.responseText || request_light_1.getErrorStatusDescription(error.status) || error.toString());
    });
};
// create the JSON language service
var languageService = vscode_json_languageservice_1.getLanguageService({
    schemaRequestService: schemaRequestService,
    workspaceContext: workspaceContext,
    contributions: []
});
var jsonConfigurationSettings = void 0;
var schemaAssociations = void 0;
var formatterRegistration = null;
// The settings have changed. Is send on server activation as well.
connection.onDidChangeConfiguration(function (change) {
    var settings = change.settings;
    request_light_1.configure(settings.http && settings.http.proxy, settings.http && settings.http.proxyStrictSSL);
    jsonConfigurationSettings = settings.json && settings.json.schemas;
    updateConfiguration();
    // dynamically enable & disable the formatter
    if (clientDynamicRegisterSupport) {
        var enableFormatter = settings && settings.json && settings.json.format && settings.json.format.enable;
        if (enableFormatter) {
            if (!formatterRegistration) {
                formatterRegistration = connection.client.register(vscode_languageserver_1.DocumentRangeFormattingRequest.type, { documentSelector: [{ language: 'json' }, { language: 'jsonc' }] });
            }
        }
        else if (formatterRegistration) {
            formatterRegistration.then(function (r) { return r.dispose(); });
            formatterRegistration = null;
        }
    }
});
// The jsonValidation extension configuration has changed
connection.onNotification(SchemaAssociationNotification.type, function (associations) {
    schemaAssociations = associations;
    updateConfiguration();
});
// A schema has changed
connection.onNotification(SchemaContentChangeNotification.type, function (uri) {
    languageService.resetSchema(uri);
});
function updateConfiguration() {
    var languageSettings = {
        validate: true,
        allowComments: true,
        schemas: new Array()
    };
    if (schemaAssociations) {
        for (var pattern in schemaAssociations) {
            var association = schemaAssociations[pattern];
            if (Array.isArray(association)) {
                association.forEach(function (uri) {
                    languageSettings.schemas.push({ uri: uri, fileMatch: [pattern] });
                });
            }
        }
    }
    if (jsonConfigurationSettings) {
        jsonConfigurationSettings.forEach(function (schema, index) {
            var uri = schema.url;
            if (!uri && schema.schema) {
                uri = schema.schema.id || "vscode://schemas/custom/" + index;
            }
            if (uri) {
                languageSettings.schemas.push({ uri: uri, fileMatch: schema.fileMatch, schema: schema.schema });
            }
        });
    }
    languageService.configure(languageSettings);
    // Revalidate any open text documents
    documents.all().forEach(triggerValidation);
}
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(function (change) {
    triggerValidation(change.document);
});
// a document has closed: clear all diagnostics
documents.onDidClose(function (event) {
    cleanPendingValidation(event.document);
    connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});
var pendingValidationRequests = {};
var validationDelayMs = 500;
function cleanPendingValidation(textDocument) {
    var request = pendingValidationRequests[textDocument.uri];
    if (request) {
        clearTimeout(request);
        delete pendingValidationRequests[textDocument.uri];
    }
}
function triggerValidation(textDocument) {
    cleanPendingValidation(textDocument);
    pendingValidationRequests[textDocument.uri] = setTimeout(function () {
        delete pendingValidationRequests[textDocument.uri];
        validateTextDocument(textDocument);
    }, validationDelayMs);
}
function validateTextDocument(textDocument) {
    if (textDocument.getText().length === 0) {
        // ignore empty documents
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });
        return;
    }
    try {
        var jsonDocument = getJSONDocument(textDocument);
        var documentSettings = textDocument.languageId === 'jsonc' ? { comments: 'ignore', trailingCommas: 'ignore' } : { comments: 'error', trailingCommas: 'error' };
        languageService.doValidation(textDocument, jsonDocument, documentSettings).then(function (diagnostics) {
            // Send the computed diagnostics to VSCode.
            connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: diagnostics });
        });
    }
    catch (e) {
        connection.console.error(errors_1.formatError("Error while validating " + textDocument.uri, e));
    }
}
connection.onDidChangeWatchedFiles(function (change) {
    // Monitored files have changed in VSCode
    var hasChanges = false;
    change.changes.forEach(function (c) {
        if (languageService.resetSchema(c.uri)) {
            hasChanges = true;
        }
    });
    if (hasChanges) {
        documents.all().forEach(validateTextDocument);
    }
});
var jsonDocuments = languageModelCache_1.getLanguageModelCache(10, 60, function (document) { return languageService.parseJSONDocument(document); });
documents.onDidClose(function (e) {
    jsonDocuments.onDocumentRemoved(e.document);
});
connection.onShutdown(function () {
    jsonDocuments.dispose();
});
function getJSONDocument(document) {
    return jsonDocuments.get(document);
}
connection.onCompletion(function (textDocumentPosition) {
    return errors_1.runSafeAsync(function () {
        var document = documents.get(textDocumentPosition.textDocument.uri);
        var jsonDocument = getJSONDocument(document);
        return languageService.doComplete(document, textDocumentPosition.position, jsonDocument);
    }, null, "Error while computing completions for " + textDocumentPosition.textDocument.uri);
});
connection.onCompletionResolve(function (completionItem) {
    return errors_1.runSafeAsync(function () {
        return languageService.doResolve(completionItem);
    }, completionItem, "Error while resolving completion proposal");
});
connection.onHover(function (textDocumentPositionParams) {
    return errors_1.runSafeAsync(function () {
        var document = documents.get(textDocumentPositionParams.textDocument.uri);
        var jsonDocument = getJSONDocument(document);
        return languageService.doHover(document, textDocumentPositionParams.position, jsonDocument);
    }, null, "Error while computing hover for " + textDocumentPositionParams.textDocument.uri);
});
connection.onDocumentSymbol(function (documentSymbolParams) {
    return errors_1.runSafe(function () {
        var document = documents.get(documentSymbolParams.textDocument.uri);
        var jsonDocument = getJSONDocument(document);
        return languageService.findDocumentSymbols(document, jsonDocument);
    }, [], "Error while computing document symbols for " + documentSymbolParams.textDocument.uri);
});
connection.onDocumentRangeFormatting(function (formatParams) {
    return errors_1.runSafe(function () {
        var document = documents.get(formatParams.textDocument.uri);
        return languageService.format(document, formatParams.range, formatParams.options);
    }, [], "Error while formatting range for " + formatParams.textDocument.uri);
});
connection.onRequest(protocol_colorProvider_proposed_1.DocumentColorRequest.type, function (params) {
    return errors_1.runSafeAsync(function () {
        var document = documents.get(params.textDocument.uri);
        if (document) {
            var jsonDocument = getJSONDocument(document);
            return languageService.findDocumentColors(document, jsonDocument);
        }
        return Promise.resolve([]);
    }, [], "Error while computing document colors for " + params.textDocument.uri);
});
connection.onRequest(protocol_colorProvider_proposed_1.ColorPresentationRequest.type, function (params) {
    return errors_1.runSafe(function () {
        var document = documents.get(params.textDocument.uri);
        if (document) {
            var jsonDocument = getJSONDocument(document);
            return languageService.getColorPresentations(document, jsonDocument, params.color, params.range);
        }
        return [];
    }, [], "Error while computing color presentations for " + params.textDocument.uri);
});
connection.onRequest(foldingProvider_proposed_1.FoldingRangesRequest.type, function (params) {
    return errors_1.runSafe(function () {
        var document = documents.get(params.textDocument.uri);
        if (document) {
            var ranges = [];
            var stack = [];
            var prevStart = -1;
            var scanner = jsonc_parser_1.createScanner(document.getText(), false);
            var token = scanner.scan();
            while (token !== jsonc_parser_1.SyntaxKind.EOF) {
                switch (token) {
                    case jsonc_parser_1.SyntaxKind.OpenBraceToken:
                    case jsonc_parser_1.SyntaxKind.OpenBracketToken: {
                        var startLine = document.positionAt(scanner.getTokenOffset()).line;
                        var range = { startLine: startLine, endLine: startLine, type: token === jsonc_parser_1.SyntaxKind.OpenBraceToken ? 'object' : 'array' };
                        stack.push(range);
                        break;
                    }
                    case jsonc_parser_1.SyntaxKind.CloseBraceToken:
                    case jsonc_parser_1.SyntaxKind.CloseBracketToken: {
                        var type = token === jsonc_parser_1.SyntaxKind.CloseBraceToken ? 'object' : 'array';
                        if (stack.length > 0 && stack[stack.length - 1].type === type) {
                            var range = stack.pop();
                            var line = document.positionAt(scanner.getTokenOffset()).line;
                            if (range && line > range.startLine + 1 && prevStart !== range.startLine) {
                                range.endLine = line - 1;
                                ranges.push(range);
                                prevStart = range.startLine;
                            }
                        }
                        break;
                    }
                    case jsonc_parser_1.SyntaxKind.BlockCommentTrivia: {
                        var startLine = document.positionAt(scanner.getTokenOffset()).line;
                        var endLine = document.positionAt(scanner.getTokenOffset() + scanner.getTokenLength()).line;
                        if (startLine < endLine) {
                            ranges.push({ startLine: startLine, endLine: endLine, type: foldingProvider_proposed_1.FoldingRangeType.Comment });
                            prevStart = startLine;
                        }
                        break;
                    }
                    case jsonc_parser_1.SyntaxKind.LineCommentTrivia: {
                        var text = document.getText().substr(scanner.getTokenOffset(), scanner.getTokenLength());
                        var m = text.match(/^\/\/\s*#(region\b)|(endregion\b)/);
                        if (m) {
                            var line = document.positionAt(scanner.getTokenOffset()).line;
                            if (m[1]) {
                                var range = { startLine: line, endLine: line, type: foldingProvider_proposed_1.FoldingRangeType.Region };
                                stack.push(range);
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
        }
        return null;
    }, null, "Error while computing folding ranges for " + params.textDocument.uri);
});
// Listen on the connection
connection.listen();
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\json\server\out/jsonServerMain.js.map
