#!/usr/bin/env node

import { program } from "commander"
import { exit } from "process"
import { generateOutputFile, printSingleGamePrice } from "./output-generation"

program
    .option("-g, --game-name <gameName>")
    .option("-i, --input-file-path <inputFilePath>")
    .option("-o, --output-format <LIST|TABLE>")
    .option("-s, --sort-by <GAME_NAME|PRICE>")
    .option("-m, --better-price-mark [mark_symbol]")
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
    betterPriceMark: boolean | string | undefined
}>()

if (options.gameName && options.inputFilePath) {
    console.error("Error: You cannot use both -g and -i options at the same time.")
    exit(1)
} else if (!options.gameName && !options.inputFilePath) {
    console.error("Error: You must specify either -g or -i option.")
    exit(1)
}

if (
    options.outputFormat &&
    options.outputFormat.toUpperCase() != "LIST" &&
    options.outputFormat.toUpperCase() != "TABLE"
) {
    console.warn(
        `Warning: Specified output format "${options.outputFormat.toUpperCase()}" does not exists. Possible output formats: "LIST", "TABLE". Defaulting to "LIST".`
    )
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

if (typeof options.betterPriceMark === "boolean") {
    options.betterPriceMark = "^"
}

if (options.gameName) {
    printSingleGamePrice(options.gameName)
} else if (options.inputFilePath) {
    generateOutputFile(options.inputFilePath, options.outputFormat, processedSortBy, options.betterPriceMark)
}
