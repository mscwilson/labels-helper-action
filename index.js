require("dotenv").config();
const core = require("@actions/core");
const github = require("@actions/github");

const commitRegex = /^([\w\s.,'"-:`@]+) \((?:close|closes|fixes|fix) \#(\d+)\)/;
const issueBranchRegex = /^issue\/(\d+)/;

async function run() {
  const octokit = github.getOctokit(process.env.ACCESS_TOKEN);

  const context = github.context;
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  // ref for pull looks like "refs/pull/19/merge"
  // ref for a normal push looks like "refs/heads/branch-name"
  // e.g. "refs/heads/issue/123-branch" or "refs/heads/release/0.1.2"
  const refType = context.ref.split("/")[1];

  if (refType === "pull") {
    console.log("A pull request was opened");
    issueHasPr(octokit, owner, repo, context.ref.split("/")[2]);
    return;
  }

  const branchType = context.ref.split("/")[2];
  const fullBranchName = context.ref.replace("refs/heads/", "");

  switch (branchType) {
    case "release":
      console.log("Release branch discovered.");
      issueCompleted(octokit, owner, repo, fullBranchName);
      break;
    case "issue":
      console.log("Issue branch discovered.");
      if (context.eventName === "create") {
        issueInProgress(octokit, owner, repo, fullBranchName);
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
      issueNumber = branchName.match(issueBranchRegex)[1];
    } catch {
      console.log(`Couldn't find an issue number in "${branchName}"`);
      return;
    }
    addLabelToIssue(octokit, owner, repo, issueNumber, "status:has_pr");
  } catch {
    console.log(`Failed to find PR ${pullNumber}`);
  }
}

async function issueInProgress(octokit, owner, repo, fullBranchName) {
  let issueNumber;
  try {
    issueNumber = fullBranchName.match(issueBranchRegex)[1];
  } catch {
    console.log(`Couldn't find an issue number in "${fullBranchName}"`);
    return;
  }

  addLabelToIssue(octokit, owner, repo, issueNumber, "status:in_progress");
}

async function issueCompleted(octokit, owner, repo, fullBranchName) {
  let commitMessage;
  let issueNumber;

  try {
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner: owner,
      repo: repo,
      sha: fullBranchName,
    });
    commitMessage = commits[0].commit.message;
  } catch (error) {
    console.log("Couldn't find any commits");
  }

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

async function addLabelToIssue(octokit, owner, repo, issueNumber, label) {
  try {
    await octokit.rest.issues.addLabels({
      owner: owner,
      repo: repo,
      issue_number: issueNumber,
      labels: [label],
    });
    console.log(`${label} added to issue #${issueNumber}`);
  } catch (error) {
    console.log(`Couldn't find issue #${issueNumber}`);
  }
}

async function removeLabelFromIssue(octokit, owner, repo, issueNumber, label) {
  try {
    await octokit.rest.issues.removeLabel({
      owner: owner,
      repo: repo,
      issue_number: issueNumber,
      name: label,
    });
    console.log(`${label} removed from issue #${issueNumber}`);
  } catch (RequestError) {
    // that's fine
  }
}
