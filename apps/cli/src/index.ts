#!/usr/bin/env bun
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { Log } from "@epicenter/opencode/util/log.ts"
import { ShCommand } from "./commands/sh.js"
import { Installation } from "@epicenter/opencode/installation/index.js"

const cli = yargs(hideBin(process.argv))
  .scriptName("epicenter")
  .usage("$0 <command> [options]")
  .help("help", "show help")
  .alias("help", "h")
  .version("version", "show version number")
  .alias("version", "v")
  .option("print-logs", {
    describe: "print logs to stderr",
    type: "boolean",
  })
  .option("log-level", {
    describe: "log level",
    type: "string",
    choices: ["DEBUG", "INFO", "WARN", "ERROR"],
  })
  .middleware(async (opts) => {
    await Log.init({
					print: process.argv.includes('--print-logs'),
					dev: Installation.isDev(),
					level: (() => {
						if (opts.logLevel) return opts.logLevel as Log.Level;
						if (process.env.NODE_ENV === 'development') return 'DEBUG';
						return 'INFO';
					})(),
				})

    Log.Default.info('epicenter', {
					version: Installation.VERSION,
					args: process.argv.slice(2),
				});
  })
  .demandCommand(1, "You need to specify a command")
  .command(ShCommand)
  .example("epicenter sh", "Start opencode server with smart defaults")
  .example("epicenter sh --tunnel=false --open=false", "Start without cloudflare tunnel or opening the browser")
  .strict()
  .fail((msg, err, yargs) => {
    if (err) throw err
    console.error("❌", msg)
    console.error()
    yargs.showHelp()
    process.exit(1)
  })

process.on("unhandledRejection", (e) => {
  Log.Default.error("rejection", {
    e: e instanceof Error ? e.message : e,
  })
})

process.on("uncaughtException", (e) => {
  Log.Default.error("exception", {
    e: e instanceof Error ? e.message : e,
  })
})

try {
  await cli.parse()
} catch (error) {
  Log.Default.error("fatal", {
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : "Unknown",
  })
  console.error("❌ Unexpected error:", error)
  if (!process.argv.includes("--print-logs")) {
    console.error("Run with --print-logs for more details, or check log file at " + Log.file())
  }
  process.exit(1)
}