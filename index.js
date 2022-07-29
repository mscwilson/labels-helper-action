require("dotenv").config();
const core = require("@actions/core");
const github = require("@actions/github");

const commitRegex =
  /^([\w\s.,'"-:`@]+) \((?:close|closes|fixes|fix) \#(\d+)\)$/;
const branchRegex = /^(\d+)/;

async function run() {
  const octokit = github.getOctokit(process.env.ACCESS_TOKEN);

  // const owner = "mscwilson";
  // const repo = "try-out-actions-here";
  // const branchName = "release/0.2.0";
  // const issueNumber = 5;

  // issueHasPr(octokit, owner, repo, 84);

  const context = github.context;
  console.log(context.ref);

  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const event = context.eventName;

  const branchName = context.ref.split("/")[3];

  console.log(`Is this a PR? ${context.ref.split("/")[1]}`);
  console.log(`The event is a ${event}`);

  //  && event === "create"

  // ref for pull looks like "refs/pull/19/merge"
  if (context.ref.split("/")[1] === "pull") {
    console.log("A pull request was opened");
    issueHasPr(octokit, owner, repo, context.ref.split("/")[2]);
    return;
  }
  // ref for a normal push looks like "refs/heads/branch-name"
  // so in this case, "refs/heads/issue/123-branch" or "refs/heads/release/0.1.2"
  switch (context.ref.split("/")[2]) {
    case "release":
      console.log("Release branch discovered.");
      completedIssue(octokit, owner, repo, branchName);
      break;
    case "issue":
      console.log("Issue branch discovered.");
      if (event === "create") {
        issueInProgress(octokit, owner, repo, branchName);
      }
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

async function addLabelToIssue(octokit, owner, repo, issueNumber, label) {
  try {
    await octokit.rest.issues.addLabels({
      owner: owner,
      repo: repo,
      issue_number: issueNumber,
      labels: [label],
    });
  } catch (error) {
    console.log(`Couldn't find issue #${issueNumber}`);
  }
}

async function issueHasPr(octokit, owner, repo, pullNumber) {
  try {
    const { data: pull } = await octokit.rest.pulls.get({
      owner: owner,
      repo: repo,
      pull_number: pullNumber,
    });
    const branchName = pull.head.ref;
    console.log(branchName);

    let issueNumber;
    try {
      issueNumber = branchName.match(branchRegex)[1];
    } catch {
      console.log(`Couldn't find an issue number in "${branchName}"`);
      return;
    }
    addLabelToIssue(octokit, owner, repo, issueNumber, "status:has_pr");
  } catch {
    console.log(`Failed to find PR ${pullNumber}`);
  }
}

async function issueInProgress(octokit, owner, repo, branchName) {
  let issueNumber;
  try {
    issueNumber = branchName.match(branchRegex)[1];
  } catch {
    console.log(`Couldn't find an issue number in "${branchName}"`);
    return;
  }

  addLabelToIssue(octokit, owner, repo, issueNumber, "status:in_progress");
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

  addLabelToIssue(octokit, owner, repo, issueNumber, "status:completed");
  removeLabelFromIssue(octokit, owner, repo, issueNumber, "status:in_progress");
  removeLabelFromIssue(octokit, owner, repo, issueNumber, "status:has_pr");
}

async function removeLabelFromIssue(octokit, owner, repo, issueNumber, label) {
  try {
    await octokit.rest.issues.removeLabel({
      owner: owner,
      repo: repo,
      issue_number: issueNumber,
      name: label,
    });
  } catch (RequestError) {
    // that's fine
  }
}
