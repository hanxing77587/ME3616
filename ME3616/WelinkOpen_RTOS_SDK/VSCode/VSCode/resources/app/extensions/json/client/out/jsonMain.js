/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle(__filename);
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const foldingProvider_proposed_1 = require("./protocol/foldingProvider.proposed");
const hash_1 = require("./utils/hash");
var VSCodeContentRequest;
(function (VSCodeContentRequest) {
    VSCodeContentRequest.type = new vscode_languageclient_1.RequestType('vscode/content');
})(VSCodeContentRequest || (VSCodeContentRequest = {}));
var SchemaContentChangeNotification;
(function (SchemaContentChangeNotification) {
    SchemaContentChangeNotification.type = new vscode_languageclient_1.NotificationType('json/schemaContent');
})(SchemaContentChangeNotification || (SchemaContentChangeNotification = {}));
var SchemaAssociationNotification;
(function (SchemaAssociationNotification) {
    SchemaAssociationNotification.type = new vscode_languageclient_1.NotificationType('json/schemaAssociations');
})(SchemaAssociationNotification || (SchemaAssociationNotification = {}));
let telemetryReporter;
let foldingProviderRegistration = void 0;
const foldingSetting = 'json.experimental.syntaxFolding';
function activate(context) {
    let toDispose = context.subscriptions;
    let packageInfo = getPackageInfo(context);
    telemetryReporter = packageInfo && new vscode_extension_telemetry_1.default(packageInfo.name, packageInfo.version, packageInfo.aiKey);
    // The server is implemented in node
    let serverModule = context.asAbsolutePath(path.join('server', 'out', 'jsonServerMain.js'));
    // The debug options for the server
    let debugOptions = { execArgv: ['--nolazy', '--inspect=6046'] };
    // If the extension is launch in debug mode the debug server options are use
    // Otherwise the run options are used
    let serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    let documentSelector = ['json', 'jsonc'];
    // Options to control the language client
    let clientOptions = {
        // Register the server for json documents
        documentSelector,
        synchronize: {
            // Synchronize the setting section 'json' to the server
            configurationSection: ['json', 'http'],
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/*.json')
        },
        middleware: {
            workspace: {
                didChangeConfiguration: () => client.sendNotification(vscode_languageclient_1.DidChangeConfigurationNotification.type, { settings: getSettings() })
            }
        }
    };
    // Create the language client and start the client.
    let client = new vscode_languageclient_1.LanguageClient('json', localize(0, null), serverOptions, clientOptions);
    client.registerProposedFeatures();
    let disposable = client.start();
    toDispose.push(disposable);
    client.onReady().then(() => {
        disposable = client.onTelemetry(e => {
            if (telemetryReporter) {
                telemetryReporter.sendTelemetryEvent(e.key, e.data);
            }
        });
        // handle content request
        client.onRequest(VSCodeContentRequest.type, (uriPath) => {
            let uri = vscode_1.Uri.parse(uriPath);
            return vscode_1.workspace.openTextDocument(uri).then(doc => {
                return doc.getText();
            }, error => {
                return Promise.reject(error);
            });
        });
        let handleContentChange = (uri) => {
            if (uri.scheme === 'vscode' && uri.authority === 'schemas') {
                client.sendNotification(SchemaContentChangeNotification.type, uri.toString());
            }
        };
        toDispose.push(vscode_1.workspace.onDidChangeTextDocument(e => handleContentChange(e.document.uri)));
        toDispose.push(vscode_1.workspace.onDidCloseTextDocument(d => handleContentChange(d.uri)));
        client.sendNotification(SchemaAssociationNotification.type, getSchemaAssociation(context));
        initFoldingProvider();
        toDispose.push(vscode_1.workspace.onDidChangeConfiguration(c => {
            if (c.affectsConfiguration(foldingSetting)) {
                initFoldingProvider();
            }
        }));
        toDispose.push({ dispose: () => foldingProviderRegistration && foldingProviderRegistration.dispose() });
    });
    let languageConfiguration = {
        wordPattern: /("(?:[^\\\"]*(?:\\.)?)*"?)|[^\s{}\[\],:]+/,
        indentationRules: {
            increaseIndentPattern: /^.*(\{[^}]*|\[[^\]]*)$/,
            decreaseIndentPattern: /^\s*[}\]],?\s*$/
        }
    };
    vscode_1.languages.setLanguageConfiguration('json', languageConfiguration);
    vscode_1.languages.setLanguageConfiguration('jsonc', languageConfiguration);
    function initFoldingProvider() {
        let enable = vscode_1.workspace.getConfiguration().get(foldingSetting);
        if (enable) {
            if (!foldingProviderRegistration) {
                foldingProviderRegistration = vscode_1.languages.registerFoldingProvider(documentSelector, {
                    provideFoldingRanges(document) {
                        return client.sendRequest(foldingProvider_proposed_1.FoldingRangesRequest.type, { textDocument: client.code2ProtocolConverter.asTextDocumentIdentifier(document) }).then(res => {
                            if (res && Array.isArray(res.ranges)) {
                                return new vscode_1.FoldingRangeList(res.ranges.map(r => new vscode_1.FoldingRange(r.startLine, r.endLine, r.type)));
                            }
                            return null;
                        });
                    }
                });
            }
        }
        else {
            if (foldingProviderRegistration) {
                foldingProviderRegistration.dispose();
                foldingProviderRegistration = void 0;
            }
        }
    }
}
exports.activate = activate;
function deactivate() {
    return telemetryReporter ? telemetryReporter.dispose() : Promise.resolve(null);
}
exports.deactivate = deactivate;
function getSchemaAssociation(context) {
    let associations = {};
    vscode_1.extensions.all.forEach(extension => {
        let packageJSON = extension.packageJSON;
        if (packageJSON && packageJSON.contributes && packageJSON.contributes.jsonValidation) {
            let jsonValidation = packageJSON.contributes.jsonValidation;
            if (Array.isArray(jsonValidation)) {
                jsonValidation.forEach(jv => {
                    let { fileMatch, url } = jv;
                    if (fileMatch && url) {
                        if (url[0] === '.' && url[1] === '/') {
                            url = vscode_1.Uri.file(path.join(extension.extensionPath, url)).toString();
                        }
                        if (fileMatch[0] === '%') {
                            fileMatch = fileMatch.replace(/%APP_SETTINGS_HOME%/, '/User');
                            fileMatch = fileMatch.replace(/%APP_WORKSPACES_HOME%/, '/Workspaces');
                        }
                        else if (fileMatch.charAt(0) !== '/' && !fileMatch.match(/\w+:\/\//)) {
                            fileMatch = '/' + fileMatch;
                        }
                        let association = associations[fileMatch];
                        if (!association) {
                            association = [];
                            associations[fileMatch] = association;
                        }
                        association.push(url);
                    }
                });
            }
        }
    });
    return associations;
}
function getSettings() {
    let httpSettings = vscode_1.workspace.getConfiguration('http');
    let settings = {
        http: {
            proxy: httpSettings.get('proxy'),
            proxyStrictSSL: httpSettings.get('proxyStrictSSL')
        },
        json: {
            format: vscode_1.workspace.getConfiguration('json').get('format'),
            schemas: [],
        }
    };
    let schemaSettingsById = Object.create(null);
    let collectSchemaSettings = (schemaSettings, rootPath, fileMatchPrefix) => {
        for (let setting of schemaSettings) {
            let url = getSchemaId(setting, rootPath);
            if (!url) {
                continue;
            }
            let schemaSetting = schemaSettingsById[url];
            if (!schemaSetting) {
                schemaSetting = schemaSettingsById[url] = { url, fileMatch: [] };
                settings.json.schemas.push(schemaSetting);
            }
            let fileMatches = setting.fileMatch;
            if (Array.isArray(fileMatches)) {
                if (fileMatchPrefix) {
                    fileMatches = fileMatches.map(m => fileMatchPrefix + m);
                }
                schemaSetting.fileMatch.push(...fileMatches);
            }
            if (setting.schema) {
                schemaSetting.schema = setting.schema;
            }
        }
    };
    // merge global and folder settings. Qualify all file matches with the folder path.
    let globalSettings = vscode_1.workspace.getConfiguration('json', null).get('schemas');
    if (Array.isArray(globalSettings)) {
        collectSchemaSettings(globalSettings, vscode_1.workspace.rootPath);
    }
    let folders = vscode_1.workspace.workspaceFolders;
    if (folders) {
        for (let folder of folders) {
            let folderUri = folder.uri;
            let schemaConfigInfo = vscode_1.workspace.getConfiguration('json', folderUri).inspect('schemas');
            let folderSchemas = schemaConfigInfo.workspaceFolderValue;
            if (Array.isArray(folderSchemas)) {
                let folderPath = folderUri.toString();
                if (folderPath[folderPath.length - 1] !== '/') {
                    folderPath = folderPath + '/';
                }
                collectSchemaSettings(folderSchemas, folderUri.fsPath, folderPath + '*');
            }
        }
    }
    return settings;
}
function getSchemaId(schema, rootPath) {
    let url = schema.url;
    if (!url) {
        if (schema.schema) {
            url = schema.schema.id || `vscode://schemas/custom/${encodeURIComponent(hash_1.hash(schema.schema).toString(16))}`;
        }
    }
    else if (rootPath && (url[0] === '.' || url[0] === '/')) {
        url = vscode_1.Uri.file(path.normalize(path.join(rootPath, url))).toString();
    }
    return url;
}
function getPackageInfo(context) {
    let extensionPackage = require(context.asAbsolutePath('./package.json'));
    if (extensionPackage) {
        return {
            name: extensionPackage.name,
            version: extensionPackage.version,
            aiKey: extensionPackage.aiKey
        };
    }
    return void 0;
}
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\json\client\out/jsonMain.js.map
