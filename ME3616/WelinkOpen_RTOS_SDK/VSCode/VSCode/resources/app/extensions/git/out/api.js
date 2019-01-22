/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
function createApi(modelPromise) {
    return {
        getRepositories() {
            return __awaiter(this, void 0, void 0, function* () {
                const model = yield modelPromise;
                return model.repositories.map(repository => ({
                    rootUri: vscode_1.Uri.file(repository.root),
                    inputBox: {
                        set value(value) {
                            repository.inputBox.value = value;
                        },
                        get value() {
                            return repository.inputBox.value;
                        }
                    }
                }));
            });
        }
    };
}
exports.createApi = createApi;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\git\out/api.js.map
