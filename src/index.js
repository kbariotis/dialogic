import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import readline from "readline";
import fs from "fs/promises";
import { runAgent } from "./agent.js";

let currentController = null;
let sessionHistory = [];
let mistakeLog = [];

function terminate() {
  console.log(chalk.yellow("\nExiting..."));
  process.exit(0);
}

process.on("SIGINT", () => terminate());
process.on("SIGTERM", () => terminate());

readline.emitKeypressEvents(process.stdin);

function handleKeypress(str, key) {
  if (key.ctrl && key.name === "s") {
    if (currentController) {
      console.log(chalk.yellow("\n[Hotkey] Cancelling current operation..."));
      currentController.abort();
      currentController = null;
    }
  } else if (key.ctrl && key.name === "r") {
    console.log(chalk.yellow("\n[Hotkey] Resetting session memory..."));
    sessionHistory = [];
    mistakeLog = [];
  } else if (key.ctrl && key.name === "c") {
    terminate();
  }
}

const PROFILE_PATH = "./profile.json";

async function loadOrPromptProfile() {
  try {
    const data = await fs.readFile(PROFILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.log(chalk.green("Let's set up your profile first!\n"));
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "language",
        message: "What language are you trying to learn?",
        validate: (val) => val.trim().length > 0 || "Required.",
      },
      {
        type: "input",
        name: "level",
        message:
          "What is your current level? (e.g., Beginner, A2, B1, Advanced)",
        validate: (val) => val.trim().length > 0 || "Required.",
      },
      {
        type: "input",
        name: "interests",
        message:
          "What are a few interests of yours? (e.g., travel, technology, cooking)",
        validate: (val) => val.trim().length > 0 || "Required.",
      },
    ]);
    await fs.writeFile(PROFILE_PATH, JSON.stringify(answers, null, 2), "utf-8");
    console.log(chalk.green("\nProfile saved!\n"));
    return answers;
  }
}

async function main() {
  const profile = await loadOrPromptProfile();

  console.log(
    chalk.cyan.bold(`\nWelcome to the ${profile.language} Roleplay Tutor\n`),
  );
  console.log(
    chalk.dim(
      "Type 'exit' or 'quit' to exit. Use Ctrl+S to cancel response, Ctrl+R to reset memory.\n",
    ),
  );

  let spinner = ora("Initializing scenario...").start();
  currentController = new AbortController();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.on("keypress", handleKeypress);
  }

  try {
    const { answer, history } = await runAgent(
      "[SYSTEM: Initialize a random scenario and start the conversation. The user has not spoken yet.]",
      spinner,
      currentController.signal,
      sessionHistory,
      profile,
      mistakeLog,
    );
    sessionHistory = history;

    // Switch raw mode back off for prompt
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.removeListener("keypress", handleKeypress);
    }
    spinner.stop();

    console.log(chalk.blue.bold("\nTutor: ") + answer + "\n");
  } catch (error) {
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    spinner.fail("Failed to initialize scenario.");
    console.error(chalk.red(error.stack));
    terminate();
  }

  while (true) {
    const { input } = await inquirer.prompt([
      {
        type: "input",
        name: "input",
        message: chalk.green("You:"),
        prefix: " ",
        validate: (val) => val.trim().length > 0 || "Please enter a response.",
      },
    ]);

    if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
      terminate();
      break;
    }

    spinner = ora("Tutor is thinking...").start();
    currentController = new AbortController();

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.on("keypress", handleKeypress);
    }

    try {
      const { answer, feedback, history } = await runAgent(
        input,
        spinner,
        currentController.signal,
        sessionHistory,
        profile,
        mistakeLog,
      );
      sessionHistory = history;
      mistakeLog.push({ turn: mistakeLog.length, user_input: input, feedback });

      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
        process.stdin.removeListener("keypress", handleKeypress);
      }
      spinner.stop();

      console.log(chalk.blue.bold("\nTutor: ") + answer + "\n");
      if (feedback) {
        console.log(chalk.red.dim(`[Analysis] ${feedback}\n`));
      }
    } catch (error) {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
        process.stdin.removeListener("keypress", handleKeypress);
      }
      if (
        error.name === "AbortError" ||
        (error.message && error.message.includes("abort"))
      ) {
        spinner.warn("Response cancelled.");
      } else {
        spinner.fail("An error occurred.");
        console.error(chalk.red(error.stack));
      }
    } finally {
      currentController = null;
    }
  }
}

main().catch((err) => {
  console.error(chalk.red("Fatal error:"), err);
  process.exit(1);
});
