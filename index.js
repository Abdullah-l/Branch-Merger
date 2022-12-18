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
function filterLabel(labels, target) {
    console.log("labels length: " + labels.length);
    console.log("target: " + target);
    for (const l of labels) {
        console.log("label: " + l.name);
        return l.name.toLowerCase() === target.toLowerCase();
    }
}
function setOutput(pull) {
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
            const merge = git.merge("origin/" + branchName, ["--squash"]).catch((err) => {
                if (err.git) {
                    console.log(err.git);
                    return err.git;
                } // the unsuccessful mergeSummary
                console.log(err);
                throw err; // some other error, so throw
            });
            if (merge.failed) {
                console.log(`Merge resulted in ${merge.conflicts.length} conflicts`);
            }
            git.commit("Merge branch '" + branchName + "' into stag");
        }
        catch (error) {
            console.log(error);
        }
    }
}
function resetBranch() {
    console.log("resetting branch");
    git.addConfig("user.name", "github-actions");
    git.addConfig("user.email", "gggg@gggg.com");
    git.fetch();
    console.log(git.status());
    git.checkout("stag");
    git.reset("hard", ["origin/master"]);
}
function push() {
    console.log("pushing");
    git.push("origin", "stag", ["--force"]);
}
resetBranch();
(async () => {
    const prom = pullRequests(repoOwner, repo);
    prom.then((pulls) => {
        console.log("data: " + pulls.data);
        let claim = pulls.data.filter(p => filterLabel(p.labels, label));
        setOutput(claim);
    });
});
push();
