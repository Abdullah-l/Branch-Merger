import * as core from '@actions/core'
import * as github from '@actions/github'
import path from 'path'

const simpleGit = require("simple-git");
const baseDir = path.join(process.cwd(),'')
console.log(baseDir)
const git = simpleGit({ baseDir })


const token: string = core.getInput('token')
const label: string = core.getInput('label')
console.log("beginning label: " + label)
const repoOwner: string = github.context.repo.owner
const repo: string = github.context.repo.repo


function pullRequests(repoOwner:string, repo:string ) {
    let client = github.getOctokit(token)
    let resp = client.rest.pulls.list({
        owner: repoOwner,
        repo: repo,
    }).catch(
        e => {
            core.setFailed(e.message)
        }
    )
    console.dir(resp, { depth: null })
    core.info(`pullRequests: ${resp}`)
    console.log(`pullRequests: ${resp}`)
    return resp
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

        const merge = await git.merge("origin/" + branchName, ["--squash"]).catch((err) => {
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

        await git.commit("Merge branch '" + branchName + "' into stag");
        
    } catch (error) {
        console.log(error);
    }
}
}
async function resetBranch() {
    console.log("resetting branch")
    await git.addConfig("user.name", "github-actions");
    await git.addConfig("user.email", "gggg@gggg.com");
    await git.fetch();
    console.log(await git.status())
    await git.checkout("stag");
    await git.reset("hard", ["origin/master"]);
}

async function push() {
    console.log("pushing")
    await git.push("origin", "stag", ["--force"]);
}

const prom = pullRequests(repoOwner,repo)
resetBranch();
prom.then((pulls: any) => {
    console.log("data: " + pulls.data)
    let claim = pulls.data.filter(
        p => filterLabel(p.labels, label)
    )
    setOutput(claim)
}).finally(() => {
    push();
})
