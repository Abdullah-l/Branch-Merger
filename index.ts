import * as core from '@actions/core'
import * as github from '@actions/github'
import path from 'path'

const simpleGit = require("simple-git");
const baseDir = path.join(process.cwd(),'')
console.log(baseDir)
const git = simpleGit({ baseDir })


const token: string = core.getInput('token')
const label: string = core.getInput('label')
const originBranch: string = core.getInput('originBranch')
const targetBranch: string = core.getInput('targetBranch')
console.log("beginning label: " + label)
const repoOwner: string = github.context.repo.owner
const repo: string = github.context.repo.repo
const client = github.getOctokit(token)


async function pullRequests(repoOwner:string, repo:string ) {
    try {
        let resp = await client.rest.pulls.list({
            owner: repoOwner,
            repo: repo,
            direction: "asc",
        })
        console.log(`pullRequests len: ${resp.data.length}`)
        console.log(`pullRequests data: ${resp.data}`)
        return resp.data
    } catch (error) {
        core.setFailed(error.message)
    }
}

function filterLabel(labels ,target: string):boolean{
    console.log("labels length: " + labels.length);
    console.log("target: " + target);
    for (const l of labels) {
        console.log("label: " + l.name)
        return l.name.toLowerCase() === target.toLowerCase()
    }

}

async function setOutput(pull){
    console.log("here we go")
    console.log("pullLength: " + pull.length)
    console.log("pull: " + pull)

    for (const p of pull) {
        console.log("pull: " + p)
        if (p == null) {
            return null
        }
        const branchName = p.head.ref
        console.log(branchName)
        console.log('\n')
    try {

        console.log("merging " + branchName)
        try {
          const merge = await git.raw(["merge", "origin/" + branchName, "--squash"])
          console.log("merge status: \n" + merge);
        } catch (error) {
          console.log("caught merge error: " + error)
          undoMerge(p, branchName);
          continue;
        }
         
        const status = await git.status();
        console.log(status)

        if (status.conflicted.length > 0) {
            console.log("conflicts detected")
            undoMerge(p, branchName)
            continue;
        }

        console.log("committing " + branchName)
        const commit = await git.commit("Merged " + branchName + " into " + targetBranch);
        console.log(commit)
        
    } catch (error) {
        console.log(error);
    }
}
}

async function undoMerge(p, branchName) {
    await git.raw(["reset", "--merge"]);
    await update_pr(p.number, branchName);
    console.log("printing status")
    const status = await git.status();
    console.log(status)
}

async function update_pr(pr_number, branchName) {
    await client.rest.issues.createComment({
      owner: repoOwner,
      repo: repo,
      issue_number: pr_number,
      body: `The branch \`${branchName}\` has conflicts with \`${targetBranch}\` and couldn't be merged.
       Please create a new branch based on \`${targetBranch}\`, resolve the conflicts, then open a PR and add the label \`${label}\.`
    });

    await client.rest.issues.removeLabel({
        owner: repoOwner,
        repo: repo,
        issue_number: pr_number,
        name: label
    });
  }

async function resetBranch() {
    console.log("resetting branch")
    await git.addConfig("user.name", "github-actions");
    await git.addConfig("user.email", "gggg@gggg.com");
    await git.fetch();
    await git.checkout(targetBranch);
    await git.raw(["reset", "--hard", "origin/" + originBranch]);
    console.log(await git.status())

}

async function push() {
    console.log("pushing")
    await git.push("origin", targetBranch, ["--force"]);
}

async function main() {
    await resetBranch();
    const pulls = await pullRequests(repoOwner,repo)
    console.log("pulls: " + pulls)
    let claim = pulls.filter(
        p => filterLabel(p.labels, label)
    )
    console.log("claim: " + claim)

    await setOutput(claim);
    await push();
}

main();