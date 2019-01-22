"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle(__filename);
const security_1 = require("../security");
/**
 * Strings used inside the markdown preview.
 *
 * Stored here and then injected in the preview so that they
 * can be localized using our normal localization process.
 */
const previewStrings = {
    cspAlertMessageText: localize(0, null),
    cspAlertMessageTitle: localize(1, null),
    cspAlertMessageLabel: localize(2, null)
};
class MarkdownContentProvider {
    constructor(engine, context, cspArbiter, logger) {
        this.engine = engine;
        this.context = context;
        this.cspArbiter = cspArbiter;
        this.logger = logger;
        this.extraStyles = [];
        this.extraScripts = [];
    }
    addScript(resource) {
        this.extraScripts.push(resource);
    }
    addStyle(resource) {
        this.extraStyles.push(resource);
    }
    async provideTextDocumentContent(markdownDocument, previewConfigurations, initialLine = undefined) {
        const sourceUri = markdownDocument.uri;
        const config = previewConfigurations.loadAndCacheConfiguration(sourceUri);
        const initialData = {
            source: sourceUri.toString(),
            line: initialLine,
            lineCount: markdownDocument.lineCount,
            scrollPreviewWithEditor: config.scrollPreviewWithEditor,
            scrollEditorWithPreview: config.scrollEditorWithPreview,
            doubleClickToSwitchToEditor: config.doubleClickToSwitchToEditor,
            disableSecurityWarnings: this.cspArbiter.shouldDisableSecurityWarnings()
        };
        this.logger.log('provideTextDocumentContent', initialData);
        // Content Security Policy
        const nonce = new Date().getTime() + '' + new Date().getMilliseconds();
        const csp = this.getCspForResource(sourceUri, nonce);
        const body = await this.engine.render(sourceUri, config.previewFrontMatter === 'hide', markdownDocument.getText());
        return `<!DOCTYPE html>
			<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				${csp}
				<meta id="vscode-markdown-preview-data" data-settings="${JSON.stringify(initialData).replace(/"/g, '&quot;')}" data-strings="${JSON.stringify(previewStrings).replace(/"/g, '&quot;')}">
				<script src="${this.extensionResourcePath('csp.js')}" nonce="${nonce}"></script>
				<script src="${this.extensionResourcePath('loading.js')}" nonce="${nonce}"></script>
				${this.getStyles(sourceUri, nonce, config)}
				<base href="${markdownDocument.uri.with({ scheme: 'vscode-workspace-resource' }).toString(true)}">
			</head>
			<body class="vscode-body ${config.scrollBeyondLastLine ? 'scrollBeyondLastLine' : ''} ${config.wordWrap ? 'wordWrap' : ''} ${config.markEditorSelection ? 'showEditorSelection' : ''}">
				${body}
				<div class="code-line" data-line="${markdownDocument.lineCount}"></div>
				${this.getScripts(nonce)}
			</body>
			</html>`;
    }
    extensionResourcePath(mediaFile) {
        return vscode.Uri.file(this.context.asAbsolutePath(path.join('media', mediaFile)))
            .with({ scheme: 'vscode-extension-resource' })
            .toString();
    }
    fixHref(resource, href) {
        if (!href) {
            return href;
        }
        // Use href if it is already an URL
        const hrefUri = vscode.Uri.parse(href);
        if (['http', 'https'].indexOf(hrefUri.scheme) >= 0) {
            return hrefUri.toString();
        }
        // Use href as file URI if it is absolute
        if (path.isAbsolute(href) || hrefUri.scheme === 'file') {
            return vscode.Uri.file(href)
                .with({ scheme: 'vscode-workspace-resource' })
                .toString();
        }
        // Use a workspace relative path if there is a workspace
        let root = vscode.workspace.getWorkspaceFolder(resource);
        if (root) {
            return vscode.Uri.file(path.join(root.uri.fsPath, href))
                .with({ scheme: 'vscode-workspace-resource' })
                .toString();
        }
        // Otherwise look relative to the markdown file
        return vscode.Uri.file(path.join(path.dirname(resource.fsPath), href))
            .with({ scheme: 'vscode-workspace-resource' })
            .toString();
    }
    computeCustomStyleSheetIncludes(resource, config) {
        if (config.styles && Array.isArray(config.styles)) {
            return config.styles.map(style => {
                return `<link rel="stylesheet" class="code-user-style" data-source="${style.replace(/"/g, '&quot;')}" href="${this.fixHref(resource, style)}" type="text/css" media="screen">`;
            }).join('\n');
        }
        return '';
    }
    getSettingsOverrideStyles(nonce, config) {
        return `<style nonce="${nonce}">
			body {
				${config.fontFamily ? `font-family: ${config.fontFamily};` : ''}
				${isNaN(config.fontSize) ? '' : `font-size: ${config.fontSize}px;`}
				${isNaN(config.lineHeight) ? '' : `line-height: ${config.lineHeight};`}
			}
		</style>`;
    }
    getStyles(resource, nonce, config) {
        const baseStyles = [
            this.extensionResourcePath('markdown.css'),
            this.extensionResourcePath('tomorrow.css')
        ].concat(this.extraStyles.map(resource => resource.toString()));
        return `${baseStyles.map(href => `<link rel="stylesheet" type="text/css" href="${href}">`).join('\n')}
			${this.getSettingsOverrideStyles(nonce, config)}
			${this.computeCustomStyleSheetIncludes(resource, config)}`;
    }
    getScripts(nonce) {
        const scripts = [this.extensionResourcePath('main.js')].concat(this.extraScripts.map(resource => resource.toString()));
        return scripts
            .map(source => `<script async src="${source}" nonce="${nonce}" charset="UTF-8"></script>`)
            .join('\n');
    }
    getCspForResource(resource, nonce) {
        switch (this.cspArbiter.getSecurityLevelForResource(resource)) {
            case security_1.MarkdownPreviewSecurityLevel.AllowInsecureContent:
                return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-workspace-resource: vscode-extension-resource: http: https: data:; media-src vscode-workspace-resource: vscode-extension-resource: http: https: data:; script-src 'nonce-${nonce}'; style-src vscode-workspace-resource: 'unsafe-inline' http: https: data: vscode-extension-resource:; font-src vscode-workspace-resource: vscode-extension-resource: http: https: data:;">`;
            case security_1.MarkdownPreviewSecurityLevel.AllowScriptsAndAllContent:
                return '';
            case security_1.MarkdownPreviewSecurityLevel.Strict:
            default:
                return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-workspace-resource: vscode-extension-resource: https: data:; media-src vscode-workspace-resource: vscode-extension-resource: https: data:; script-src 'nonce-${nonce}'; style-src vscode-workspace-resource: 'unsafe-inline' https: data: vscode-extension-resource:; font-src vscode-workspace-resource: vscode-extension-resource: https: data:;">`;
        }
    }
}
exports.MarkdownContentProvider = MarkdownContentProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\markdown\out/features\previewContentProvider.js.map
