"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const path_1 = __importDefault(require("path"));
const simpleGit = require("simple-git");
const baseDir = path_1.default.join(process.cwd(), '');
console.log(baseDir);
const git = simpleGit({ baseDir });
const token = core.getInput('token');
const labels = JSON.parse(core.getInput('labels'));
const repoOwner = github.context.repo.owner;
const repo = github.context.repo.repo;
function pullRequests(repoOwner, repo) {
    let client = github.getOctokit(token);
    let resp = client.rest.pulls.list({
        owner: repoOwner,
        repo: repo,
    }).catch(e => {
        core.setFailed(e.message);
    });
    console.dir(resp, { depth: null });
    core.info(`pullRequests: ${resp}`);
    console.log(`pullRequests: ${resp}`);
    return resp;
}
// function filterLabel(labels ,target: string[]):boolean{
//     let labelname = labels.map((label) => {
//         return label.name
//     })
//     let filterdLabels = labelname.filter(
//         label => target.indexOf(label) != -1
//     )
//     if ( filterdLabels.length == target.length) {
//         return true
//     } else {
//         return false
//     }
// }
async function setOutput(pull) {
    let output = '';
    for (const p of pull) {
        console.log(p.head.ref);
        console.log('\n');
        output = output + p.title + "\\n" + p.html_url + "\\n---\\n";
    }
    try {
        console.log("testdfjkgdrfjk");
        await git.addConfig("user.name", "github-actions");
        await git.addConfig("user.email", "gggg@gggg.com");
        await git.fetch();
        console.log(await git.status());
        await git.checkout("stag");
        await git.reset("hard", ["origin/master"]);
        const merge = await git.merge("origin/feat-no-conf", ["--squash"]).catch((err) => {
            if (err.git) {
                return err.git;
            } // the unsuccessful mergeSummary
            throw err; // some other error, so throw
        });
        if (merge.failed) {
            console.error(`Merge resulted in ${merge.conflicts.length} conflicts`);
        }
        // await git.commit("Merge feat-no-conf");
        await git.push("origin", "stag", ["--force"]);
    }
    catch (error) {
        console.log(error);
    }
    console.log(output);
    core.setOutput('pulls', output);
    core.setOutput('daddy', output);
}
// async function resetBranch() {
// }
const now = Date.now();
const prom = pullRequests(repoOwner, repo);
prom.then((pulls) => {
    let claim = pulls.data;
    setOutput(claim);
});
