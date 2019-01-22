/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
/**
 * Send to debug console.
 */
function writeToConsole(message) {
    vscode.debug.activeDebugConsole.appendLine(message);
}
exports.writeToConsole = writeToConsole;
/**
 * Copy attributes from fromObject to toObject.
 */
function extendObject(toObject, fromObject) {
    for (let key in fromObject) {
        if (fromObject.hasOwnProperty(key)) {
            toObject[key] = fromObject[key];
        }
    }
    return toObject;
}
exports.extendObject = extendObject;

//# sourceMappingURL=../../../out/node/extension/utilities.js.map
