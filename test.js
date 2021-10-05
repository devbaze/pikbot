// const assert = require("assert");
const electron = require("electron");
const kill = require("tree-kill");
const puppeteer = require("puppeteer-core");
const { spawn } = require("child_process");

let pid;

const run = async () => {
  const port = 9200; // Debugging port
  const startTime = Date.now();
  const timeout = 20000; // Timeout in miliseconds
  let app;

  // Start Electron with custom debugging port
  pid = spawn(electron, [".", `--remote-debugging-port=${port}`], {
    shell: true
  }).pid;

  // Wait for Puppeteer to connect
  while (!app) {
    try {
      app = await puppeteer.connect({
        browserURL: `http://localhost:${port}`,
        defaultViewport: { width: 1000, height: 600 } // Optional I think
      });
    } catch (error) {
      if (Date.now() > startTime + timeout) {
        throw error;
      }
    }
  }

  // Do something, e.g.:
  // const [page] = await app.pages();
  // await page.waitForSelector("#someid")// 
  // const text = await page.$eval("#someid", element => element.innerText);
  // assert(text === "Your expected text");
  // await page.close();
};

run()
  .then(() => {
    // Do something
  })
  .catch(error => {
    // Do something
    kill(pid, () => {
      process.exit(1);
    });
  });