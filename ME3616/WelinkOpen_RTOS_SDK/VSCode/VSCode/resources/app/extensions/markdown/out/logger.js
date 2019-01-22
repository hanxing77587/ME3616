"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
var Trace;
(function (Trace) {
    Trace[Trace["Off"] = 0] = "Off";
    Trace[Trace["Verbose"] = 1] = "Verbose";
})(Trace || (Trace = {}));
(function (Trace) {
    function fromString(value) {
        value = value.toLowerCase();
        switch (value) {
            case 'off':
                return Trace.Off;
            case 'verbose':
                return Trace.Verbose;
            default:
                return Trace.Off;
        }
    }
    Trace.fromString = fromString;
})(Trace || (Trace = {}));
function isString(value) {
    return Object.prototype.toString.call(value) === '[object String]';
}
class Logger {
    constructor() {
        this.updateConfiguration();
    }
    log(message, data) {
        if (this.trace === Trace.Verbose) {
            this.output.appendLine(`[Log - ${(new Date().toLocaleTimeString())}] ${message}`);
            if (data) {
                this.output.appendLine(Logger.data2String(data));
            }
        }
    }
    updateConfiguration() {
        this.trace = this.readTrace();
    }
    get output() {
        if (!this._output) {
            this._output = vscode_1.window.createOutputChannel('Markdown');
        }
        return this._output;
    }
    readTrace() {
        return Trace.fromString(vscode_1.workspace.getConfiguration().get('markdown.trace', 'off'));
    }
    static data2String(data) {
        if (data instanceof Error) {
            if (isString(data.stack)) {
                return data.stack;
            }
            return data.message;
        }
        if (isString(data)) {
            return data;
        }
        return JSON.stringify(data, undefined, 2);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\markdown\out/logger.js.map
