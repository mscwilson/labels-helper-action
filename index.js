require("dotenv").config();
const core = require("@actions/core");
const github = require("@actions/github");

console.log("Hello from index.js");

const commitRegex =
  /^([\w\s.,'"-:`@]+) \((?:close|closes|fixes|fix) \#(\d+)\)$/;

async function run() {
  const octokit = github.getOctokit(process.env.ACCESS_TOKEN);

  // const accessToken = core.getInput("ACCESS_TOKEN");
  // const octokit = github.getOctokit(accessToken);
  // const octokit = github.getOctokit(process.env.PAT);
  // const owner = "mscwilson";
  // const repo = "try-out-actions-here";
  // const branchName = "release/0.2.0";
  // const issueNumber = 5;

  const context = github.context;
  const owner = context.repository.owner.name;
  const repo = context.repository.name;

  const branchName = context.ref.replace("refs/heads/", "");
  const branchType = branchName.split("/")[0];

  const { data: commits } = await octokit.rest.repos.listCommits({
    owner: owner,
    repo: repo,
    sha: branchName,
  });

  const commitMessage = commits[0].commit.message;
  const issueNumber = commitMessage.match(commitRegex)[2];

  try {
    await octokit.rest.issues.addLabels({
      owner: owner,
      repo: repo,
      issue_number: issueNumber,
      labels: ["status:completed"],
    });
  } catch (error) {
    console.log(`Couldn't find issue #${issueNumber}`);
  }

  try {
    await octokit.rest.issues.removeLabel({
      owner: owner,
      repo: repo,
      issue_number: issueNumber,
      name: "status:in_progress",
    });
  } catch (RequestError) {
    // that's fine
  }

  try {
    await octokit.rest.issues.removeLabel({
      owner: owner,
      repo: repo,
      issue_number: issueNumber,
      name: "status:has_pr",
    });
  } catch (RequestError) {
    // that's fine
  }
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
