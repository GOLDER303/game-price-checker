import { readFileSync, writeFileSync } from "fs"
import path from "path"
import { exit } from "process"
import { getGamePrice } from "./data-fetching"
import { alignOutputTableColumnWidths } from "./output-generation-utils"

export const printSingleGamePrice = async (gameName: string) => {
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

export const generateOutputFile = async (inputFilePath: string, outputFormat: "LIST" | "TABLE") => {
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
