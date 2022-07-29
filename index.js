require("dotenv").config();
const core = require("@actions/core");
const github = require("@actions/github");

console.log("Hello from index.js");

const commitRegex =
  /^([\w\s.,'"-:`@]+) \((?:close|closes|fixes|fix) \#(\d+)\)$/;
const branchRegex = /^issue\/(\d+)/;

async function run() {
  const octokit = github.getOctokit(process.env.ACCESS_TOKEN);

  // const owner = "mscwilson";
  // const repo = "try-out-actions-here";
  // const branchName = "release/0.2.0";
  // const issueNumber = 5;

  const context = github.context;
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const event = context.eventName;

  const branchName = context.ref.replace("refs/heads/", "");
  const branchType = branchName.split("/")[0];

  switch (branchType) {
    case "release":
      console.log("Release branch discovered.");
      completedIssue(octokit, owner, repo, branchName);
      break;
    case "issue":
      console.log("Issue branch discovered.");
      console.log(`The event was ${event}`);

      issueInProgress(octokit, owner, repo, branchName);
      break;
    case "main":
    case "master":
      console.log("Main/master branch.");
      break;
    default:
      console.log("What's this random branch?");
  }
}

run();

async function issueInProgress(octokit, owner, repo, branchName) {
  let issueNumber;
  try {
    issueNumber = branchName.match(branchRegex)[1];
  } catch {
    console.log(`Couldn't find an issue number in "${branchName}"`);
    return;
  }
  console.log(issueNumber);

  try {
    await octokit.rest.issues.addLabels({
      owner: owner,
      repo: repo,
      issue_number: issueNumber,
      labels: ["status:in_progress"],
    });
  } catch (error) {
    console.log(`Couldn't find issue #${issueNumber}`);
  }
}

async function completedIssue(octokit, owner, repo, branchName) {
  const { data: commits } = await octokit.rest.repos.listCommits({
    owner: owner,
    repo: repo,
    sha: branchName,
  });

  const commitMessage = commits[0].commit.message;
  let issueNumber;
  try {
    issueNumber = commitMessage.match(commitRegex)[2];
  } catch {
    console.log(`Couldn't find an issue number in "${commitMessage}"`);
    return;
  }

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
