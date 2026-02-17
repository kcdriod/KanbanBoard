const { spawn } = require("node:child_process");

const electronBinary = require("electron");
const args = process.argv.slice(2);
const env = { ...process.env };

// Some shells persist this and force Electron to run as plain Node.
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBinary, args, {
  stdio: "inherit",
  windowsHide: false,
  env
});

let childClosed = false;

child.on("close", (code, signal) => {
  childClosed = true;
  if (code === null) {
    console.error(`${electronBinary} exited with signal ${signal}`);
    process.exit(1);
  }
  process.exit(code);
});

const forwardSignal = (signal) => {
  process.on(signal, () => {
    if (!childClosed) {
      child.kill(signal);
    }
  });
};

forwardSignal("SIGINT");
forwardSignal("SIGTERM");
forwardSignal("SIGUSR2");
