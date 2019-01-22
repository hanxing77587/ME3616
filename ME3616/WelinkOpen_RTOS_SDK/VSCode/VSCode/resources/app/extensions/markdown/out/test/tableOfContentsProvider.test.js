"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
require("mocha");
const tableOfContentsProvider_1 = require("../tableOfContentsProvider");
const markdownEngine_1 = require("../markdownEngine");
const testFileName = vscode.Uri.parse('test.md');
suite('markdown.TableOfContentsProvider', () => {
    test('Lookup should not return anything for empty document', async () => {
        const doc = new InMemoryDocument(testFileName, '');
        const provider = new tableOfContentsProvider_1.TableOfContentsProvider(new markdownEngine_1.MarkdownEngine(), doc);
        assert.strictEqual(await provider.lookup(''), undefined);
        assert.strictEqual(await provider.lookup('foo'), undefined);
    });
    test('Lookup should not return anything for document with no headers', async () => {
        const doc = new InMemoryDocument(testFileName, 'a *b*\nc');
        const provider = new tableOfContentsProvider_1.TableOfContentsProvider(new markdownEngine_1.MarkdownEngine(), doc);
        assert.strictEqual(await provider.lookup(''), undefined);
        assert.strictEqual(await provider.lookup('foo'), undefined);
        assert.strictEqual(await provider.lookup('a'), undefined);
        assert.strictEqual(await provider.lookup('b'), undefined);
    });
    test('Lookup should return basic #header', async () => {
        const doc = new InMemoryDocument(testFileName, `# a\nx\n# c`);
        const provider = new tableOfContentsProvider_1.TableOfContentsProvider(new markdownEngine_1.MarkdownEngine(), doc);
        {
            const entry = await provider.lookup('a');
            assert.ok(entry);
            assert.strictEqual(entry.line, 0);
        }
        {
            assert.strictEqual(await provider.lookup('x'), undefined);
        }
        {
            const entry = await provider.lookup('c');
            assert.ok(entry);
            assert.strictEqual(entry.line, 2);
        }
    });
    test('Lookups should be case in-sensitive', async () => {
        const doc = new InMemoryDocument(testFileName, `# fOo\n`);
        const provider = new tableOfContentsProvider_1.TableOfContentsProvider(new markdownEngine_1.MarkdownEngine(), doc);
        assert.strictEqual((await provider.lookup('fOo')).line, 0);
        assert.strictEqual((await provider.lookup('foo')).line, 0);
        assert.strictEqual((await provider.lookup('FOO')).line, 0);
    });
    test('Lookups should ignore leading and trailing white-space, and collapse internal whitespace', async () => {
        const doc = new InMemoryDocument(testFileName, `#      f o  o    \n`);
        const provider = new tableOfContentsProvider_1.TableOfContentsProvider(new markdownEngine_1.MarkdownEngine(), doc);
        assert.strictEqual((await provider.lookup('f o  o')).line, 0);
        assert.strictEqual((await provider.lookup('  f o  o')).line, 0);
        assert.strictEqual((await provider.lookup('  f o  o  ')).line, 0);
        assert.strictEqual((await provider.lookup('f o o')).line, 0);
        assert.strictEqual((await provider.lookup('f o       o')).line, 0);
        assert.strictEqual(await provider.lookup('f'), undefined);
        assert.strictEqual(await provider.lookup('foo'), undefined);
        assert.strictEqual(await provider.lookup('fo o'), undefined);
    });
});
class InMemoryDocument {
    constructor(uri, _contents) {
        this.uri = uri;
        this._contents = _contents;
        this.fileName = '';
        this.isUntitled = false;
        this.languageId = '';
        this.version = 1;
        this.isDirty = false;
        this.isClosed = false;
        this.eol = vscode.EndOfLine.LF;
        this._lines = this._contents.split(/\n/g);
    }
    get lineCount() {
        return this._lines.length;
    }
    lineAt(line) {
        return {
            lineNumber: line,
            text: this._lines[line],
            range: new vscode.Range(0, 0, 0, 0),
            firstNonWhitespaceCharacterIndex: 0,
            rangeIncludingLineBreak: new vscode.Range(0, 0, 0, 0),
            isEmptyOrWhitespace: false
        };
    }
    offsetAt(_position) {
        throw new Error('Method not implemented.');
    }
    positionAt(_offset) {
        throw new Error('Method not implemented.');
    }
    getText(_range) {
        return this._contents;
    }
    getWordRangeAtPosition(_position, _regex) {
        throw new Error('Method not implemented.');
    }
    validateRange(_range) {
        throw new Error('Method not implemented.');
    }
    validatePosition(_position) {
        throw new Error('Method not implemented.');
    }
    save() {
        throw new Error('Method not implemented.');
    }
}
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\markdown\out/test\tableOfContentsProvider.test.js.map
