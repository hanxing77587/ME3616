"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
/* --------------------------------------------------------------------------------------------
 * Includes code from typescript-sublime-plugin project, obtained from
 * https://github.com/Microsoft/TypeScript-Sublime-Plugin/blob/master/TypeScript%20Indent.tmPreferences
 * ------------------------------------------------------------------------------------------ */
const vscode_1 = require("vscode");
const PConst = require("./protocol.const");
const typescriptServiceClient_1 = require("./typescriptServiceClient");
const languageProvider_1 = require("./languageProvider");
const typingsStatus_1 = require("./utils/typingsStatus");
const versionStatus_1 = require("./utils/versionStatus");
const convert_1 = require("./utils/convert");
// Style check diagnostics that can be reported as warnings
const styleCheckDiagnostics = [
    6133,
    6138,
    7027,
    7028,
    7029,
    7030 // not all code paths return a value
];
class TypeScriptServiceClientHost {
    constructor(descriptions, workspaceState, plugins, commandManager, logDirectoryProvider) {
        this.commandManager = commandManager;
        this.languages = [];
        this.languagePerId = new Map();
        this.disposables = [];
        this.reportStyleCheckAsWarnings = true;
        const handleProjectCreateOrDelete = () => {
            this.client.execute('reloadProjects', null, false);
            this.triggerAllDiagnostics();
        };
        const handleProjectChange = () => {
            setTimeout(() => {
                this.triggerAllDiagnostics();
            }, 1500);
        };
        const configFileWatcher = vscode_1.workspace.createFileSystemWatcher('**/[tj]sconfig.json');
        this.disposables.push(configFileWatcher);
        configFileWatcher.onDidCreate(handleProjectCreateOrDelete, this, this.disposables);
        configFileWatcher.onDidDelete(handleProjectCreateOrDelete, this, this.disposables);
        configFileWatcher.onDidChange(handleProjectChange, this, this.disposables);
        this.client = new typescriptServiceClient_1.default(this, workspaceState, version => this.versionStatus.onDidChangeTypeScriptVersion(version), plugins, logDirectoryProvider);
        this.disposables.push(this.client);
        this.versionStatus = new versionStatus_1.default(resource => this.client.normalizePath(resource));
        this.disposables.push(this.versionStatus);
        this.typingsStatus = new typingsStatus_1.default(this.client);
        this.ataProgressReporter = new typingsStatus_1.AtaProgressReporter(this.client);
        for (const description of descriptions) {
            const manager = new languageProvider_1.default(this.client, description, this.commandManager, this.typingsStatus);
            this.languages.push(manager);
            this.disposables.push(manager);
            this.languagePerId.set(description.id, manager);
        }
        this.client.ensureServiceStarted();
        this.client.onReady(() => {
            if (!this.client.apiVersion.has230Features()) {
                return;
            }
            const languages = new Set();
            for (const plugin of plugins) {
                for (const language of plugin.languages) {
                    languages.add(language);
                }
            }
            if (languages.size) {
                const description = {
                    id: 'typescript-plugins',
                    modeIds: Array.from(languages.values()),
                    diagnosticSource: 'ts-plugins',
                    isExternal: true
                };
                const manager = new languageProvider_1.default(this.client, description, this.commandManager, this.typingsStatus);
                this.languages.push(manager);
                this.disposables.push(manager);
                this.languagePerId.set(description.id, manager);
            }
        });
        this.client.onTsServerStarted(() => {
            this.triggerAllDiagnostics();
        });
        vscode_1.workspace.onDidChangeConfiguration(this.configurationChanged, this, this.disposables);
        this.configurationChanged();
    }
    dispose() {
        while (this.disposables.length) {
            const obj = this.disposables.pop();
            if (obj) {
                obj.dispose();
            }
        }
        this.typingsStatus.dispose();
        this.ataProgressReporter.dispose();
    }
    get serviceClient() {
        return this.client;
    }
    reloadProjects() {
        this.client.execute('reloadProjects', null, false);
        this.triggerAllDiagnostics();
    }
    handles(file) {
        return !!this.findLanguage(file);
    }
    configurationChanged() {
        const config = vscode_1.workspace.getConfiguration('typescript');
        this.reportStyleCheckAsWarnings = config.get('reportStyleChecksAsWarnings', true);
    }
    async findLanguage(file) {
        try {
            const doc = await vscode_1.workspace.openTextDocument(this.client.asUrl(file));
            return this.languages.find(language => language.handles(file, doc));
        }
        catch (_a) {
            return undefined;
        }
    }
    triggerAllDiagnostics() {
        for (const language of this.languagePerId.values()) {
            language.triggerAllDiagnostics();
        }
    }
    /* internal */ populateService() {
        // See https://github.com/Microsoft/TypeScript/issues/5530
        vscode_1.workspace.saveAll(false).then(() => {
            for (const language of this.languagePerId.values()) {
                language.reInitialize();
            }
        });
    }
    /* internal */ syntaxDiagnosticsReceived(event) {
        const body = event.body;
        if (body && body.diagnostics) {
            this.findLanguage(body.file).then(language => {
                if (language) {
                    language.syntaxDiagnosticsReceived(this.client.asUrl(body.file), this.createMarkerDatas(body.diagnostics, language.diagnosticSource));
                }
            });
        }
    }
    /* internal */ semanticDiagnosticsReceived(event) {
        const body = event.body;
        if (body && body.diagnostics) {
            this.findLanguage(body.file).then(language => {
                if (language) {
                    language.semanticDiagnosticsReceived(this.client.asUrl(body.file), this.createMarkerDatas(body.diagnostics, language.diagnosticSource));
                }
            });
        }
    }
    /* internal */ configFileDiagnosticsReceived(event) {
        // See https://github.com/Microsoft/TypeScript/issues/10384
        const body = event.body;
        if (!body || !body.diagnostics || !body.configFile) {
            return;
        }
        (this.findLanguage(body.configFile)).then(language => {
            if (!language) {
                return;
            }
            if (body.diagnostics.length === 0) {
                language.configFileDiagnosticsReceived(this.client.asUrl(body.configFile), []);
            }
            else if (body.diagnostics.length >= 1) {
                vscode_1.workspace.openTextDocument(vscode_1.Uri.file(body.configFile)).then((document) => {
                    let curly = undefined;
                    let nonCurly = undefined;
                    let diagnostic;
                    for (let index = 0; index < document.lineCount; index++) {
                        const line = document.lineAt(index);
                        const text = line.text;
                        const firstNonWhitespaceCharacterIndex = line.firstNonWhitespaceCharacterIndex;
                        if (firstNonWhitespaceCharacterIndex < text.length) {
                            if (text.charAt(firstNonWhitespaceCharacterIndex) === '{') {
                                curly = [index, firstNonWhitespaceCharacterIndex, firstNonWhitespaceCharacterIndex + 1];
                                break;
                            }
                            else {
                                const matches = /\s*([^\s]*)(?:\s*|$)/.exec(text.substr(firstNonWhitespaceCharacterIndex));
                                if (matches && matches.length >= 1) {
                                    nonCurly = [index, firstNonWhitespaceCharacterIndex, firstNonWhitespaceCharacterIndex + matches[1].length];
                                }
                            }
                        }
                    }
                    const match = curly || nonCurly;
                    if (match) {
                        diagnostic = new vscode_1.Diagnostic(new vscode_1.Range(match[0], match[1], match[0], match[2]), body.diagnostics[0].text);
                    }
                    else {
                        diagnostic = new vscode_1.Diagnostic(new vscode_1.Range(0, 0, 0, 0), body.diagnostics[0].text);
                    }
                    if (diagnostic) {
                        diagnostic.source = language.diagnosticSource;
                        language.configFileDiagnosticsReceived(this.client.asUrl(body.configFile), [diagnostic]);
                    }
                }, _error => {
                    language.configFileDiagnosticsReceived(this.client.asUrl(body.configFile), [new vscode_1.Diagnostic(new vscode_1.Range(0, 0, 0, 0), body.diagnostics[0].text)]);
                });
            }
        });
    }
    createMarkerDatas(diagnostics, source) {
        const result = [];
        for (let diagnostic of diagnostics) {
            const { start, end, text } = diagnostic;
            const range = new vscode_1.Range(convert_1.tsLocationToVsPosition(start), convert_1.tsLocationToVsPosition(end));
            const converted = new vscode_1.Diagnostic(range, text);
            converted.severity = this.getDiagnosticSeverity(diagnostic);
            converted.source = diagnostic.source || source;
            if (diagnostic.code) {
                converted.code = diagnostic.code;
            }
            result.push(converted);
        }
        return result;
    }
    getDiagnosticSeverity(diagnostic) {
        if (this.reportStyleCheckAsWarnings && this.isStyleCheckDiagnostic(diagnostic.code)) {
            return vscode_1.DiagnosticSeverity.Warning;
        }
        switch (diagnostic.category) {
            case PConst.DiagnosticCategory.error:
                return vscode_1.DiagnosticSeverity.Error;
            case PConst.DiagnosticCategory.warning:
                return vscode_1.DiagnosticSeverity.Warning;
            default:
                return vscode_1.DiagnosticSeverity.Error;
        }
    }
    isStyleCheckDiagnostic(code) {
        return code ? styleCheckDiagnostics.indexOf(code) !== -1 : false;
    }
}
exports.default = TypeScriptServiceClientHost;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/typeScriptServiceClientHost.js.map
