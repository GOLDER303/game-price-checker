#!/usr/bin/env node

import axios, { AxiosError, AxiosResponse } from "axios"
import * as cheerio from "cheerio"
import { program } from "commander"
import { readFileSync, writeFileSync } from "fs"
import path from "path"
import { exit } from "process"

const isStringTuple = (arr: any): arr is [string, string] => {
    return Array.isArray(arr) && arr.length === 2 && typeof arr[0] === "string" && typeof arr[1] === "string"
}

const normalizeGameName = (input: string): string => {
    const trimmedInput = input.trim()
    return trimmedInput
        .replace(/^\[\[(.*?)\]\]$/, "$1")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/ /g, "-")
        .replace(/--/g, "-")
        .toLowerCase()
}

const getGamePrice = async (gameName: string): Promise<[string, string] | null> => {
    const normalizedGameName = normalizeGameName(gameName)

    let response: AxiosResponse
    try {
        response = await axios.get(`https://gg.deals/game/${normalizedGameName}`)
    } catch (err) {
        const error = err as AxiosError

        if (error.status === 404) {
            console.error(`Game "${normalizedGameName}" not found`)
        } else if (error.response && error.response.status === 404) {
            console.error(`Game "${normalizedGameName}" not found`)
        } else {
            console.error(`Error while fetching game data. Game: "${normalizedGameName}"`)
        }

        return null
    }

    const data = response.data

    const $ = cheerio.load(data)

    const prices = $("div.header-game-prices-content.active")
        .find(".game-info-price-col span.price-inner.numeric")
        .map((_, element) => $(element).text())
        .get()

    if (!isStringTuple(prices)) {
        console.error(`Error while parsing game page data. Game: "${normalizedGameName}"`)
        return null
    }

    return prices
}

const printSingleGamePrice = async (gameName: string) => {
    if (!gameName) {
        console.log("No game name given!")
        exit(1)
    }

    const gamePrice = await getGamePrice(gameName)
    if (!gamePrice) {
        exit()
    }

    const [officialPrice, keyshopsPrice] = gamePrice

    console.log(`Official: ${officialPrice}`)
    console.log(`Keyshops: ${keyshopsPrice}`)

    exit()
}

const alignOutputTableColumnWidths = (lines: string[]): string[] => {
    const columnWidths: number[] = []

    lines.forEach((line) => {
        const columns = line.split("|").map((col) => col.trim())

        columns.forEach((col, colIndex) => {
            columnWidths[colIndex] = Math.max(columnWidths[colIndex] || 0, col.length)
        })
    })

    let separatingLine = " |"

    columnWidths.forEach((columnWidth) => {
        if (columnWidth == 0) {
            return
        }

        separatingLine += "-".repeat(columnWidth + 2)
        separatingLine += "|"
    })

    const equalizedLines = lines.map((line, index) => {
        if (index === 1) {
            return ""
        }

        const columns = line.split("|").map((col) => col.trim())

        const paddedColumns = columns.map((col, index) => {
            const width = columnWidths[index]
            return col.padEnd(width)
        })

        return `${paddedColumns.join(" | ")}`
    })

    equalizedLines[1] = separatingLine

    return equalizedLines
}

const handleInputFile = async (inputFilePath: string, outputFormat: "LIST" | "TABLE") => {
    const inputFile = readFileSync(inputFilePath).toString()
    const inputFileName = path.parse(path.basename(inputFilePath)).name

    let lines: string[]
    if (inputFile.includes("\r")) {
        lines = inputFile.split("\r\n")
    } else {
        lines = inputFile.split("\n")
    }

    const outputLines: string[] = []

    if (outputFormat == "TABLE") {
        outputLines.push("| Game Name | Official Price | Keyshops Price |")
    }

    for (const line of lines) {
        let gameName = line

        if (line.startsWith("-")) {
            gameName = line.substring(1, line.length)
        }

        const gamePrice = await getGamePrice(gameName)
        if (!gamePrice) {
            continue
        }
        const [officialPrice, keyshopsPrice] = gamePrice

        if (outputFormat == "LIST") {
            outputLines.push(`- ${gameName} -> ${officialPrice} | ${keyshopsPrice}`)
        } else {
            outputLines.push(`| ${gameName} | ${officialPrice} | ${keyshopsPrice} |`)
        }
    }

    let processedOutputLines = outputLines

    if (outputFormat == "TABLE") {
        processedOutputLines = alignOutputTableColumnWidths(outputLines)
    }

    const outFile = path.join(path.dirname(inputFilePath), `${inputFileName}_out${path.extname(inputFilePath)}`)

    writeFileSync(outFile, processedOutputLines.join("\n"))
}

program
    .option("-g, --game-name <gameName>")
    .option("-i, --input-file-path <inputFilePath>")
    .option("-o, --output-format <LIST|TABLE>")
    .description("Specify a game name")

program.parse(process.argv)

if (process.argv.length < 3) {
    program.help()
}

const options = program.opts<{
    gameName: string | undefined
    inputFilePath: string | undefined
    outputFormat: string | undefined
}>()

if (options.gameName && options.inputFilePath) {
    console.error("Error: You cannot use both -g and -i options at the same time.")
    exit(1)
} else if (!options.gameName && !options.inputFilePath) {
    console.error("Error: You must specify either -g or -i option.")
    exit(1)
}

if (options.gameName) {
    printSingleGamePrice(options.gameName)
} else if (options.inputFilePath) {
    if (options.outputFormat?.toUpperCase() == "TABLE") {
        handleInputFile(options.inputFilePath, "TABLE")
    } else {
        handleInputFile(options.inputFilePath, "LIST")
    }
}
