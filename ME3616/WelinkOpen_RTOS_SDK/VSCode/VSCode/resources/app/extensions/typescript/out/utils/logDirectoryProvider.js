"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
class LogDirectoryProvider {
    constructor(context) {
        this.context = context;
    }
    async getNewLogDirectory() {
        const root = await this.context.logger.logDirectory;
        try {
            return fs.mkdtempSync(path.join(root, `tsserver-log-`));
        }
        catch (e) {
            return undefined;
        }
    }
}
exports.default = LogDirectoryProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/utils\logDirectoryProvider.js.map
