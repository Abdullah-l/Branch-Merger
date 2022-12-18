import * as core from '@actions/core'
import * as github from '@actions/github'
import path from 'path'

const simpleGit = require("simple-git");
const baseDir = path.join(process.cwd(),'')
console.log(baseDir)
const git = simpleGit({ baseDir })


const token: string = core.getInput('token')
const label: string = core.getInput('label')
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
    let labelname = labels.map((label) => {
        return label.name
    })
    let filterdLabels = labelname.filter(
        label => target.indexOf(label) != -1
    )
    if ( filterdLabels.length == target.length) {
        return true
    } else {
        return false
    }
}

async function setOutput(pull){
    let output = ''
    console.log("here we go")
    await git.addConfig("user.name", "github-actions");
    await git.addConfig("user.email", "gggg@gggg.com");
    for (const p of pull) {
        if (p == null) {
            return null
        }
        const branchName = p.head.ref
        console.log(branchName)
        console.log('\n')
    try {
        await git.fetch();
        console.log(await git.status())
        await git.checkout("stag");
        await git.reset("hard", ["origin/master"]);
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
        
        await git.push("origin", "stag", ["--force"]);
    } catch (error) {
        console.log(error);
    }
    console.log(output)
    core.setOutput('pulls', output)
    core.setOutput('daddy', output)
}
}
// async function resetBranch() {
// }

const prom = pullRequests(repoOwner,repo)
prom.then((pulls: any) => {
    let claim = pulls.data.filter(
        p => filterLabel(p.labels, label)
    )
    setOutput(claim)
})