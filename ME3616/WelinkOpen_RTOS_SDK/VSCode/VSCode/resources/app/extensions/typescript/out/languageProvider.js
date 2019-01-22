"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const path_1 = require("path");
const bufferSyncSupport_1 = require("./features/bufferSyncSupport");
const formattingConfigurationManager_1 = require("./features/formattingConfigurationManager");
const languageConfigurations = require("./utils/languageConfigurations");
const diagnostics_1 = require("./features/diagnostics");
const fileSchemes = require("./utils/fileSchemes");
const baseCodeLensProvider_1 = require("./features/baseCodeLensProvider");
const validateSetting = 'validate.enable';
const foldingSetting = 'typescript.experimental.syntaxFolding';
class LanguageProvider {
    constructor(client, description, commandManager, typingsStatus) {
        this.client = client;
        this.description = description;
        this.toUpdateOnConfigurationChanged = [];
        this._validate = true;
        this.disposables = [];
        this.versionDependentDisposables = [];
        this.foldingProviderRegistration = void 0;
        this.formattingOptionsManager = new formattingConfigurationManager_1.default(client);
        this.bufferSyncSupport = new bufferSyncSupport_1.default(client, description.modeIds, {
            delete: (file) => {
                this.diagnosticsManager.delete(file);
            }
        }, this._validate);
        this.diagnosticsManager = new diagnostics_1.default(description.id, this.client);
        vscode_1.workspace.onDidChangeConfiguration(this.configurationChanged, this, this.disposables);
        this.configurationChanged();
        client.onReady(async () => {
            await this.registerProviders(client, commandManager, typingsStatus);
            this.bufferSyncSupport.listen();
        });
    }
    dispose() {
        while (this.disposables.length) {
            const obj = this.disposables.pop();
            if (obj) {
                obj.dispose();
            }
        }
        while (this.versionDependentDisposables.length) {
            const obj = this.versionDependentDisposables.pop();
            if (obj) {
                obj.dispose();
            }
        }
        this.diagnosticsManager.dispose();
        this.bufferSyncSupport.dispose();
        this.formattingOptionsManager.dispose();
    }
    get documentSelector() {
        if (!this._documentSelector) {
            this._documentSelector = [];
            for (const language of this.description.modeIds) {
                for (const scheme of fileSchemes.supportedSchemes) {
                    this._documentSelector.push({ language, scheme });
                }
            }
        }
        return this._documentSelector;
    }
    async registerProviders(client, commandManager, typingsStatus) {
        const selector = this.documentSelector;
        const config = vscode_1.workspace.getConfiguration(this.id);
        this.disposables.push(vscode_1.languages.registerCompletionItemProvider(selector, new (await Promise.resolve().then(() => require('./features/completionItemProvider'))).default(client, typingsStatus, commandManager), '.', '"', '\'', '/', '@'));
        this.disposables.push(vscode_1.languages.registerCompletionItemProvider(selector, new (await Promise.resolve().then(() => require('./features/directiveCommentCompletionProvider'))).default(client), '@'));
        const { TypeScriptFormattingProvider, FormattingProviderManager } = await Promise.resolve().then(() => require('./features/formattingProvider'));
        const formattingProvider = new TypeScriptFormattingProvider(client, this.formattingOptionsManager);
        formattingProvider.updateConfiguration(config);
        this.disposables.push(vscode_1.languages.registerOnTypeFormattingEditProvider(selector, formattingProvider, ';', '}', '\n'));
        const formattingProviderManager = new FormattingProviderManager(this.description.id, formattingProvider, selector);
        formattingProviderManager.updateConfiguration();
        this.disposables.push(formattingProviderManager);
        this.toUpdateOnConfigurationChanged.push(formattingProviderManager);
        this.disposables.push(vscode_1.languages.registerCompletionItemProvider(selector, new (await Promise.resolve().then(() => require('./features/jsDocCompletionProvider'))).default(client, commandManager), '*'));
        this.disposables.push(vscode_1.languages.registerHoverProvider(selector, new (await Promise.resolve().then(() => require('./features/hoverProvider'))).default(client)));
        this.disposables.push(vscode_1.languages.registerDefinitionProvider(selector, new (await Promise.resolve().then(() => require('./features/definitionProvider'))).default(client)));
        this.disposables.push(vscode_1.languages.registerDocumentHighlightProvider(selector, new (await Promise.resolve().then(() => require('./features/documentHighlightProvider'))).default(client)));
        this.disposables.push(vscode_1.languages.registerReferenceProvider(selector, new (await Promise.resolve().then(() => require('./features/referenceProvider'))).default(client)));
        this.disposables.push(vscode_1.languages.registerDocumentSymbolProvider(selector, new (await Promise.resolve().then(() => require('./features/documentSymbolProvider'))).default(client)));
        this.disposables.push(vscode_1.languages.registerSignatureHelpProvider(selector, new (await Promise.resolve().then(() => require('./features/signatureHelpProvider'))).default(client), '(', ','));
        this.disposables.push(vscode_1.languages.registerRenameProvider(selector, new (await Promise.resolve().then(() => require('./features/renameProvider'))).default(client)));
        this.disposables.push(vscode_1.languages.registerCodeActionsProvider(selector, new (await Promise.resolve().then(() => require('./features/quickFixProvider'))).default(client, this.formattingOptionsManager, commandManager, this.diagnosticsManager)));
        this.disposables.push(vscode_1.languages.registerCodeActionsProvider(selector, new (await Promise.resolve().then(() => require('./features/refactorProvider'))).default(client, this.formattingOptionsManager, commandManager)));
        await this.initFoldingProvider();
        this.disposables.push(vscode_1.workspace.onDidChangeConfiguration(c => {
            if (c.affectsConfiguration(foldingSetting)) {
                this.initFoldingProvider();
            }
        }));
        this.disposables.push({ dispose: () => this.foldingProviderRegistration && this.foldingProviderRegistration.dispose() });
        this.registerVersionDependentProviders();
        const cachedResponse = new baseCodeLensProvider_1.CachedNavTreeResponse();
        const referenceCodeLensProvider = new (await Promise.resolve().then(() => require('./features/referencesCodeLensProvider'))).default(client, this.description.id, cachedResponse);
        referenceCodeLensProvider.updateConfiguration();
        this.toUpdateOnConfigurationChanged.push(referenceCodeLensProvider);
        this.disposables.push(vscode_1.languages.registerCodeLensProvider(selector, referenceCodeLensProvider));
        const implementationCodeLensProvider = new (await Promise.resolve().then(() => require('./features/implementationsCodeLensProvider'))).default(client, this.description.id, cachedResponse);
        implementationCodeLensProvider.updateConfiguration();
        this.toUpdateOnConfigurationChanged.push(implementationCodeLensProvider);
        this.disposables.push(vscode_1.languages.registerCodeLensProvider(selector, implementationCodeLensProvider));
        this.disposables.push(vscode_1.languages.registerWorkspaceSymbolProvider(new (await Promise.resolve().then(() => require('./features/workspaceSymbolProvider'))).default(client, this.description.modeIds)));
        if (!this.description.isExternal) {
            for (const modeId of this.description.modeIds) {
                this.disposables.push(vscode_1.languages.setLanguageConfiguration(modeId, languageConfigurations.jsTsLanguageConfiguration));
            }
        }
    }
    async initFoldingProvider() {
        let enable = vscode_1.workspace.getConfiguration().get(foldingSetting, false);
        if (enable) {
            if (!this.foldingProviderRegistration) {
                this.foldingProviderRegistration = vscode_1.languages.registerFoldingProvider(this.documentSelector, new (await Promise.resolve().then(() => require('./features/folderingProvider'))).default(this.client));
            }
        }
        else {
            if (this.foldingProviderRegistration) {
                this.foldingProviderRegistration.dispose();
                this.foldingProviderRegistration = void 0;
            }
        }
    }
    configurationChanged() {
        const config = vscode_1.workspace.getConfiguration(this.id);
        this.updateValidate(config.get(validateSetting, true));
        for (const toUpdate of this.toUpdateOnConfigurationChanged) {
            toUpdate.updateConfiguration();
        }
    }
    handles(file, doc) {
        if (doc && this.description.modeIds.indexOf(doc.languageId) >= 0) {
            return true;
        }
        if (this.bufferSyncSupport.handles(file)) {
            return true;
        }
        const base = path_1.basename(file);
        return !!base && base === this.description.configFile;
    }
    get id() {
        return this.description.id;
    }
    get diagnosticSource() {
        return this.description.diagnosticSource;
    }
    updateValidate(value) {
        if (this._validate === value) {
            return;
        }
        this._validate = value;
        this.bufferSyncSupport.validate = value;
        this.diagnosticsManager.validate = value;
        if (value) {
            this.triggerAllDiagnostics();
        }
    }
    reInitialize() {
        this.diagnosticsManager.reInitialize();
        this.bufferSyncSupport.reOpenDocuments();
        this.bufferSyncSupport.requestAllDiagnostics();
        this.formattingOptionsManager.reset();
        this.registerVersionDependentProviders();
    }
    async registerVersionDependentProviders() {
        while (this.versionDependentDisposables.length) {
            const obj = this.versionDependentDisposables.pop();
            if (obj) {
                obj.dispose();
            }
        }
        if (!this.client) {
            return;
        }
        const selector = this.documentSelector;
        if (this.client.apiVersion.has220Features()) {
            this.versionDependentDisposables.push(vscode_1.languages.registerImplementationProvider(selector, new (await Promise.resolve().then(() => require('./features/implementationProvider'))).default(this.client)));
        }
        if (this.client.apiVersion.has213Features()) {
            this.versionDependentDisposables.push(vscode_1.languages.registerTypeDefinitionProvider(selector, new (await Promise.resolve().then(() => require('./features/typeDefinitionProvider'))).default(this.client)));
        }
    }
    triggerAllDiagnostics() {
        this.bufferSyncSupport.requestAllDiagnostics();
    }
    syntaxDiagnosticsReceived(file, syntaxDiagnostics) {
        this.diagnosticsManager.syntaxDiagnosticsReceived(file, syntaxDiagnostics);
    }
    semanticDiagnosticsReceived(file, semanticDiagnostics) {
        this.diagnosticsManager.semanticDiagnosticsReceived(file, semanticDiagnostics);
    }
    configFileDiagnosticsReceived(file, diagnostics) {
        this.diagnosticsManager.configFileDiagnosticsReceived(file, diagnostics);
    }
}
exports.default = LanguageProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/languageProvider.js.map
