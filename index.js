const core = require("@actions/core");
const github = require("@actions/github");

console.log("Hello from index.js");

const context = github.context;
console.log(`This is the github context: \n ${context}`);
console.log(context.actor);
console.log(context.ref);

try {
  const nameToGreet = core.getInput("who-to-greet");
  console.log(`Hello ${nameToGreet}!`);
  const time = new Date().toTimeString();
  core.setOutput("time", time);

  const payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
