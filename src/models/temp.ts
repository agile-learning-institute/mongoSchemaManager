async function performTask() {
    console.log("Task started");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
    console.log("Task completed");
}

async function main() {
    console.log("Main started");
    await performTask();  // This will correctly wait for 'performTask' to complete
    console.log("Main finished");
}

main();
