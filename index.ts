import * as core from '@actions/core'
import * as github from '@actions/github'
import path from 'path'

const simpleGit = require("simple-git");
const baseDir = path.join(process.cwd(),'')
console.log(baseDir)
const git = simpleGit({ baseDir })


const token: string = core.getInput('token')
const labels: string[] = JSON.parse(core.getInput('labels'))
const repoOwner: string = github.context.repo.owner
const repo: string = github.context.repo.repo


function pullRequests(repoOwner:string, repo:string ) {
    let client = github.getOctokit(core.getInput('token'))
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

async function setOutput(pull){
    let output = ''
    for (const p of pull) {
        console.log(p.head.ref)
        console.log('\n')
        output = output + p.title + "\\n" + p.html_url + "\\n---\\n"
    }
    try {
        console.log("testdfjkgdrfjk")
        await git.addConfig("user.name", "github-actions");
        const configg = await git.listConfig();
        console.log(configg)
        const remotes = await git.getRemotes(true);
        console.log(remotes)
        const branch = await git.checkoutLocalBranch("test-branch");
        console.log(await git.status())
        await git.push("origin", "test-branch", ["-u"]);
    } catch (error) {
        console.log(error);
    }
    console.log(output)
    core.setOutput('pulls', output)
    core.setOutput('daddy', output)
}

const now = Date.now()
const prom = pullRequests(repoOwner,repo)
prom.then((pulls: any) => {
    let claim = pulls.data
    setOutput(claim)
})
