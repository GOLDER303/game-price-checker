#!/usr/bin/env node

import { program } from "commander"
import { exit } from "process"
import { generateOutputFile, printSingleGamePrice } from "./output-generation"

program
    .option("-g, --game-name <gameName>")
    .option("-i, --input-file-path <inputFilePath>")
    .option("-o, --output-format <LIST|TABLE>")
    .option("-s, --sort-by <GAME_NAME|PRICE>")
    .description("Specify a game name")

program.parse(process.argv)

if (process.argv.length < 3) {
    program.help()
}

const options = program.opts<{
    gameName: string | undefined
    inputFilePath: string | undefined
    outputFormat: string | undefined
    sortBy: string | undefined
}>()

if (options.gameName && options.inputFilePath) {
    console.error("Error: You cannot use both -g and -i options at the same time.")
    exit(1)
} else if (!options.gameName && !options.inputFilePath) {
    console.error("Error: You must specify either -g or -i option.")
    exit(1)
}

let processedSortBy: "GAME_NAME" | "PRICE" | undefined

if (options.sortBy) {
    options.sortBy = options.sortBy.toUpperCase().replace(/ /g, "_")
    if (options.sortBy != "GAME_NAME" && options.sortBy != "PRICE") {
        console.error("Error: Specify correct sorting option: PRICE | GAME_NAME")
        exit(1)
    }

    processedSortBy = options.sortBy
}

if (options.gameName) {
    printSingleGamePrice(options.gameName)
} else if (options.inputFilePath) {
    switch (options.outputFormat?.toUpperCase()) {
        case "TABLE":
            generateOutputFile(options.inputFilePath, "TABLE", processedSortBy)
            break

        default:
            generateOutputFile(options.inputFilePath, "LIST", processedSortBy)
            break
    }
}
