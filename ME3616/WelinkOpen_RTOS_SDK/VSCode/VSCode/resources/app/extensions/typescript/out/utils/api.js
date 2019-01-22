"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const semver = require("semver");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle(__filename);
const memoize_1 = require("./memoize");
class API {
    constructor(versionString, version) {
        this.versionString = versionString;
        this.version = version;
    }
    static fromVersionString(versionString) {
        let version = semver.valid(versionString);
        if (!version) {
            return new API(localize(0, null), '1.0.0');
        }
        // Cut off any prerelease tag since we sometimes consume those on purpose.
        const index = versionString.indexOf('-');
        if (index >= 0) {
            version = version.substr(0, index);
        }
        return new API(versionString, version);
    }
    has203Features() {
        return semver.gte(this.version, '2.0.3');
    }
    has206Features() {
        return semver.gte(this.version, '2.0.6');
    }
    has208Features() {
        return semver.gte(this.version, '2.0.8');
    }
    has213Features() {
        return semver.gte(this.version, '2.1.3');
    }
    has220Features() {
        return semver.gte(this.version, '2.2.0');
    }
    has222Features() {
        return semver.gte(this.version, '2.2.2');
    }
    has230Features() {
        return semver.gte(this.version, '2.3.0');
    }
    has234Features() {
        return semver.gte(this.version, '2.3.4');
    }
    has240Features() {
        return semver.gte(this.version, '2.4.0');
    }
    has250Features() {
        return semver.gte(this.version, '2.5.0');
    }
    has260Features() {
        return semver.gte(this.version, '2.6.0');
    }
    has262Features() {
        return semver.gte(this.version, '2.6.2');
    }
    has270Features() {
        return semver.gte(this.version, '2.7.0');
    }
}
API.defaultVersion = new API('1.0.0', '1.0.0');
__decorate([
    memoize_1.memoize
], API.prototype, "has203Features", null);
__decorate([
    memoize_1.memoize
], API.prototype, "has206Features", null);
__decorate([
    memoize_1.memoize
], API.prototype, "has208Features", null);
__decorate([
    memoize_1.memoize
], API.prototype, "has213Features", null);
__decorate([
    memoize_1.memoize
], API.prototype, "has220Features", null);
__decorate([
    memoize_1.memoize
], API.prototype, "has222Features", null);
__decorate([
    memoize_1.memoize
], API.prototype, "has230Features", null);
__decorate([
    memoize_1.memoize
], API.prototype, "has234Features", null);
__decorate([
    memoize_1.memoize
], API.prototype, "has240Features", null);
__decorate([
    memoize_1.memoize
], API.prototype, "has250Features", null);
__decorate([
    memoize_1.memoize
], API.prototype, "has260Features", null);
__decorate([
    memoize_1.memoize
], API.prototype, "has262Features", null);
__decorate([
    memoize_1.memoize
], API.prototype, "has270Features", null);
exports.default = API;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/79b44aa704ce542d8ca4a3cc44cfca566e7720f1/extensions\typescript\out/utils\api.js.map
