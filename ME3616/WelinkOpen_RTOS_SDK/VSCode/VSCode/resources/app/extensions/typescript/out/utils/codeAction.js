"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const workspaceEdit_1 = require("./workspaceEdit");
function getEditForCodeAction(client, action) {
    return action.changes && action.changes.length
        ? workspaceEdit_1.createWorkspaceEditFromFileCodeEdits(client, action.changes)
        : undefined;
}
exports.getEditForCodeAction = getEditForCodeAction;
async function applyCodeAction(client, action) {
    const workspaceEdit = getEditForCodeAction(client, action);
    if (workspaceEdit) {
        if (!(await vscode_1.workspace.applyEdit(workspaceEdit))) {
            return false;
        }
    }
    return applyCodeActionCommands(client, action);
}
exports.applyCodeAction = applyCodeAction;
async function applyCodeActionCommands(client, action) {
    if (action.commands && action.commands.length) {
        for (const command of action.commands) {
            const response = await client.execute('applyCodeActionCommand', { command });
            if (!response || !response.body) {
                return false;
            }
        }
    }
    return true;
}
exports.applyCodeActionCommands = applyCodeActionCommands;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/utils\codeAction.js.map
