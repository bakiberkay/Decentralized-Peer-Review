const { exec } = require("child_process");

const intervalsWeekly = 52; // Set the number of intervals to simulate (e.g., 52 for weekly in a year)
const intervalsMonthly = 12;
const intervalsQuarterly = 4;
const intervalsAnnually = 1;

const intervalWeekly5years = 260;
const intervalMonthly5years = 60;
const intervalQuarterly5years = 20;
const intervalAnnually5years = 5;

async function runTest() {
  for (let i = 1; i <= intervalMonthly5years; i++) {
    console.log(`Running Interval ${i}...`);

    // Run the testInteractions script to simulate interactions
    await runScript("testInteractions.js");

    // Run the simulateIntervalEnd script to process the end of interval
    await runScript("simulateIntervalEnd.js");


    console.log(`Completed Interval ${i}\n`);
  }
  console.log("All intervals completed.");
}

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    exec(`npx hardhat run scripts/${scriptName} --network localhost`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing ${scriptName}: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr from ${scriptName}: ${stderr}`);
      }
      console.log(`Output from ${scriptName}:\n${stdout}`);
      resolve();
    });
  });
}

// Run the testing sequence
runTest()
  .then(() => console.log("Testing sequence complete."))
  .catch((error) => console.error("Error during testing sequence:", error));
