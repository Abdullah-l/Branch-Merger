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
const label = core.getInput('label');
console.log("beginning label: " + label);
const repoOwner = github.context.repo.owner;
const repo = github.context.repo.repo;
const client = github.getOctokit(token);
async function pullRequests(repoOwner, repo) {
    let resp = await client.rest.pulls.list({
        owner: repoOwner,
        repo: repo,
    });
    // .catch(
    //     e => {
    //         core.setFailed(e.message)
    //     }
    // )
    console.log(`pullRequests len: ${resp.data.length}`);
    console.log(`pullRequests data: ${resp.data}`);
    return resp.data;
}
function filterLabel(labels, target) {
    console.log("labels length: " + labels.length);
    console.log("target: " + target);
    for (const l of labels) {
        console.log("label: " + l.name);
        return l.name.toLowerCase() === target.toLowerCase();
    }
}
async function setOutput(pull) {
    console.log("here we go");
    console.log("pullLength: " + pull.length);
    console.log("pull: " + pull);
    for (const p of pull) {
        console.log("pull: " + p);
        if (p == null) {
            return null;
        }
        const branchName = p.head.ref;
        console.log(branchName);
        console.log('\n');
        try {
            console.log("merging " + branchName);
            const merge = await git.merge("origin/" + branchName, ["--squash"]);
            // .catch(async (err) => {
            //     if (err.git) {
            //         console.log("problemo");
            //         console.log(err.git);
            //         run(p.number)
            //     } // the unsuccessful mergeSummary
            //     console.log("pendejo");
            //     await run(p.number)
            //     const status = await git.status();
            //     console.log(status)
            //  });
            console.log(merge);
            const status = await git.status();
            console.log(status);
            if (status.conflicted.length > 0) {
                run(p.number);
                continue;
            }
            console.log("committing " + branchName);
            const commit = await git.commit("Merged " + branchName + " into stag");
            console.log(commit);
        }
        catch (error) {
            console.log(error);
        }
    }
}
async function run(pr_number) {
    await client.rest.issues.createComment({
        owner: repoOwner,
        repo: repo,
        issue_number: pr_number,
        body: 'you got problems man'
    });
}
async function resetBranch() {
    console.log("resetting branch");
    await git.addConfig("user.name", "github-actions");
    await git.addConfig("user.email", "gggg@gggg.com");
    await git.fetch();
    await git.checkout("stag");
    await git.reset("hard", ["origin/master"]);
    console.log(await git.status());
}
async function push() {
    console.log("pushing");
    await git.push("origin", "stag", ["--force"]);
}
async function main() {
    await resetBranch();
    const pulls = await pullRequests(repoOwner, repo);
    console.log("pulls: " + pulls);
    let claim = pulls.filter(p => filterLabel(p.labels, label));
    console.log("claim: " + claim);
    await setOutput(claim);
    await push();
    // await prom.then(async (pulls: any) => {
    //     console.log("data: " + pulls.data)
    //     let claim = pulls.data.filter(
    //         p => filterLabel(p.labels, label)
    //     )
    //     await setOutput(claim)
    // })
    // await push();
}
main();
