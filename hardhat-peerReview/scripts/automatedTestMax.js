const { exec } = require("child_process");
const XLSX = require("xlsx"); // Import the xlsx package


const intervalsWeekly = 52;
const intervalsQuarterly = 4;

const intervalWeekly5years = 260;
const intervalBiweekly5years = 130;
const intervalMonthly5years = 60;
const intervalQuarterly5years = 20;
const intervalAnnually5years = 5;

const userReputationData = {}; // Object to store user reputation over time

async function runTest() {
  for (let i = 1; i <= 8; i++) {
    console.log(`Running Interval ${i}...`);

    // Run the testInteractions script to simulate interactions
    await runScript("testInteractions.js");

    // Run the simulateIntervalEnd script to process the end of interval and capture output
    const intervalResults = await runScriptWithOutput("simulateIntervalEnd.js");

    // Parse the JSON output from simulateIntervalEnd.js
    const parsedResults = JSON.parse(intervalResults);

    // Merge the results into userReputationData
    mergeReputationData(parsedResults, i);

    console.log(`Completed Interval ${i}\n`);
  }

  // Final JSON structure output
  console.log("Final User Reputation Data:", JSON.stringify(userReputationData, null, 2));
  createExcel(userReputationData);

}

function mergeReputationData(intervalResults, intervalIndex) {
  intervalResults.forEach(userData => {
    const { Address, NewReputation } = userData;

    // Initialize user entry if it doesn't exist
    if (!userReputationData[Address]) {
      userReputationData[Address] = { Address };
    }

    // Add the new reputation for this interval
    userReputationData[Address][`Rep_Interval${intervalIndex}`] = NewReputation;
  });
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

function runScriptWithOutput(scriptName) {
  return new Promise((resolve, reject) => {
    exec(`npx hardhat run scripts/${scriptName} --network localhost`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing ${scriptName}: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr from ${scriptName}: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

function createExcel(data) {
    const formattedData = Object.values(data); // Convert to an array for Excel export
  
    // Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
  
    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Reputation Data");
  
    // Generate a unique file name with a count suffix
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = `C:/Users/Baki Berkay Uzel/Desktop/TestResults/Punishment Factor Test/UserReputationData_${timestamp}.xlsx`;
    // Define file path and write to file
    //const filePath = "./UserReputationData.xlsx";
    XLSX.writeFile(workbook, filePath);
  
    console.log(`Excel file created at: ${filePath}`);
  }

// Run the testing sequence
runTest()
  .then(() => console.log("Testing sequence complete."))
  .catch((error) => console.error("Error during testing sequence:", error));
