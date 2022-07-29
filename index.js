const core = require("@actions/core");
const github = require("@actions/github");

console.log("Hello from index.js");

async function run() {
  const accessToken = core.getInput("ACCESS_TOKEN");
  const octokit = github.getOctokit(accessToken);

  const context = github.context;

  const branchName = context.ref.replace("refs/heads/", "");
  const branchType = branchName.split("/")[0];

  const { data: commits } = await octokit.rest.repos.listCommits({
    owner: "mscwilson",
    repo: "try-out-actions-here",
    sha: branchName,
  });

  console.log(commits[0]);
}

run();

// try {

//   console.log(`branch name is: ${branchName}`);
//   switch (branchType) {
//     case "release":
//       console.log("it's a release branch!");
//       break;
//     case "issue":
//       console.log("it's an issue branch!");
//       break;
//     case "main":
//     case "master":
//       console.log("we're on main street");
//       break;
//     default:
//       console.log("what's this random branch?");
//   }

//   const nameToGreet = core.getInput("who-to-greet");
//   console.log(`Hello ${nameToGreet}!`);
//   const time = new Date().toTimeString();
//   core.setOutput("time", time);

//   const payload = JSON.stringify(github.context.payload, undefined, 2);
//   console.log(`The event payload: ${payload}`);
// } catch (error) {
//   core.setFailed(error.message);
// }
