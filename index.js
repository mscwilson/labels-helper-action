const core = require("@actions/core");
const github = require("@actions/github");

console.log("Hello from index.js");

const context = github.context;
console.log(context.actor);
console.log(context.ref);

try {
  const branchName = context.ref.replace("refs/heads/", "");
  const branchType = branchName.split("/")[0];

  console.log(`branch name is: ${branchName}`);
  switch (branchType) {
    case "release":
      console.log("it's a release branch!");
      break;
    case "issue":
      console.log("it's an issue branch!");
      break;
    case ("main", "master"):
      console.log("we're on main street");
      break;
    default:
      console.log("what's this random branch?");
  }

  const nameToGreet = core.getInput("who-to-greet");
  console.log(`Hello ${nameToGreet}!`);
  const time = new Date().toTimeString();
  core.setOutput("time", time);

  const payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
