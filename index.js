"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const github = require("@actions/github");
const token = core.getInput('token');
const labels = JSON.parse(core.getInput('labels'));
const repoOwner = github.context.repo.owner;
const repo = github.context.repo.repo;
function pullRequests(repoOwner, repo) {
    let client = github.getOctokit(core.getInput('token'));
    let resp = client.rest.pulls.list({
        owner: repoOwner,
        repo: repo,
    }).catch(e => {
        core.setFailed(e.message);
    });
    core.debug(`pullRequests: ${resp}`);
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
function setOutput(pull) {
    let output = '';
    for (const p of pull) {
        output = output + p.title + "\\n" + p.html_url + "\\n---\\n";
    }
    output = output.slice(0, -7);
    core.setOutput('pulls', output);
}
const now = Date.now();
const prom = pullRequests(repoOwner, repo);
prom.then((pulls) => {
    let claim = pulls.data;
    setOutput(claim);
});
