/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
function formatError(message, err) {
    if (err instanceof Error) {
        var error = err;
        return message + ": " + error.message + "\n" + error.stack;
    }
    else if (typeof err === 'string') {
        return message + ": " + err;
    }
    else if (err) {
        return message + ": " + err.toString();
    }
    return message;
}
exports.formatError = formatError;
function runSafe(func, errorVal, errorMessage) {
    try {
        var t = func();
        if (t instanceof Promise) {
            return t.then(void 0, function (e) {
                console.error(formatError(errorMessage, e));
                return errorVal;
            });
        }
        return t;
    }
    catch (e) {
        console.error(formatError(errorMessage, e));
        return errorVal;
    }
}
exports.runSafe = runSafe;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\css\server\out/utils\errors.js.map
