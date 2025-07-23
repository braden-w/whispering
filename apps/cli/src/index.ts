#!/usr/bin/env bun
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { ShCommand } from "./commands/sh.js"

const cli = yargs(hideBin(process.argv))
  .scriptName("epicenter")
  .usage("$0 <command> [options]")
  .help("help", "show help")
  .alias("help", "h")
  .version("version", "show version number")
  .alias("version", "v")
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

try {
  await cli.parse()
} catch (error) {
  console.error("❌ Unexpected error:", error)
  process.exit(1)
}