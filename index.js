"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const dedent_1 = require("dedent");
const inputName = (0, core_1.getInput)("name");
const ghToken = (0, core_1.getInput)("ghToken");
greet(inputName, getRepoUrl(github_1.context));
getDiff().then(files => {
    console.log((0, dedent_1.default)(`
    Your PR diff:
    ${JSON.stringify(files, undefined, 2)}
    `));
});
function greet(name, repoUrl) {
    console.log(`'Hello ${name}! You are running a GH Action in ${repoUrl}'`);
}
function getRepoUrl({ repo, serverUrl }) {
    return `${serverUrl}/${repo.owner}/${repo.repo}`;
}
function getDiff() {
    return __awaiter(this, void 0, void 0, function* () {
        if (ghToken && github_1.context.payload.pull_request) {
            const octokit = (0, github_1.getOctokit)(ghToken);
            const result = yield octokit.rest.repos.compareCommits({
                repo: github_1.context.repo.repo,
                owner: github_1.context.repo.owner,
                head: github_1.context.payload.pull_request.head.sha,
                base: github_1.context.payload.pull_request.base.sha,
                per_page: 100
            });
            return result.data.files || [];
        }
        return [];
    });
}
