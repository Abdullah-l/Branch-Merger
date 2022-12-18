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
const client = github.getOctokit(token)


async function pullRequests(repoOwner:string, repo:string ) {
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

        console.log("merging " + branchName)
        const merge = await git.mergeFromTo("origin/" + branchName, "origin/stag", ["--squash"]).catch(async (err) => {
            if (err.git) {
                console.log("problemo");
                console.log(err.git);
                run(p.number)
            } // the unsuccessful mergeSummary
            console.log("pendejo");
            await run(p.number)
            const status = await git.status();
            console.log(status)
         });
         
         if (merge.failed) {
            console.log(`Merge resulted in ${merge.conflicts.length} conflicts`);
         }

         console.log(merge);

         const status = await git.status();
         console.log(status)

         if (status.conflicted.length > 0) {
            run(p.number)
            continue;
          }
         console.log("committing " + branchName)
        const commit = await git.commit("Merge branch '" + branchName + "' into stag");
        console.log(commit)
        
    } catch (error) {
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

(async () => {
    await resetBranch();
    const prom = pullRequests(repoOwner,repo)

    await prom.then(async (pulls: any) => {
        console.log("data: " + pulls.data)
        let claim = pulls.data.filter(
            p => filterLabel(p.labels, label)
        )
        await setOutput(claim)
    })
    await push();
})();
