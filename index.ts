import * as core from '@actions/core'
import * as github from '@actions/github'

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

function setOutput(pull){
    let output = ''
    for (const p of pull) {
        output = output + p.title + "\\n" + p.html_url + "\\n---\\n"
    }
    output = output.slice(0,-7)
    core.setOutput('daddy', output)
}

console.log("hiiii daddy")
console.log("\n")
core.info(`pullRequests juhiu`)
const now = Date.now()
const prom = pullRequests(repoOwner,repo)
prom.then((pulls: any) => {
    let claim = pulls.data
    setOutput(claim)
})
