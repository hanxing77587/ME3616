"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class Slug {
    constructor(value) {
        this.value = value;
    }
    static fromHeading(heading) {
        const slugifiedHeading = encodeURI(heading.trim()
            .toLowerCase()
            .replace(/[\]\[\!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~\`]/g, '')
            .replace(/\s+/g, '-')
            .replace(/^\-+/, '')
            .replace(/\-+$/, ''));
        return new Slug(slugifiedHeading);
    }
    equals(other) {
        return this.value === other.value;
    }
}
exports.Slug = Slug;
class TableOfContentsProvider {
    constructor(engine, document) {
        this.engine = engine;
        this.document = document;
    }
    async getToc() {
        if (!this.toc) {
            try {
                this.toc = await this.buildToc(this.document);
            }
            catch (e) {
                this.toc = [];
            }
        }
        return this.toc;
    }
    async lookup(fragment) {
        const toc = await this.getToc();
        const slug = Slug.fromHeading(fragment);
        return toc.find(entry => entry.slug.equals(slug));
    }
    async buildToc(document) {
        const toc = [];
        const tokens = await this.engine.parse(document.uri, document.getText());
        for (const heading of tokens.filter(token => token.type === 'heading_open')) {
            const lineNumber = heading.map[0];
            const line = document.lineAt(lineNumber);
            toc.push({
                slug: Slug.fromHeading(line.text),
                text: TableOfContentsProvider.getHeaderText(line.text),
                level: TableOfContentsProvider.getHeaderLevel(heading.markup),
                line: lineNumber,
                location: new vscode.Location(document.uri, line.range)
            });
        }
        return toc;
    }
    static getHeaderLevel(markup) {
        if (markup === '=') {
            return 1;
        }
        else if (markup === '-') {
            return 2;
        }
        else {
            return markup.length;
        }
    }
    static getHeaderText(header) {
        return header.replace(/^\s*#+\s*(.*?)\s*#*$/, (_, word) => word.trim());
    }
}
exports.TableOfContentsProvider = TableOfContentsProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\markdown\out/tableOfContentsProvider.js.map
