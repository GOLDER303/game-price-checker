import { writeFileSync } from "fs"
import { exit } from "process"
import { getGamePrice } from "./data-fetching"
import {
    alignOutputTableColumnWidths,
    generateOutputFilePath,
    getLinesFromFile,
    processLines,
    sortTableLines,
} from "./output-generation-utils"

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

export const generateOutputFile = async (
    inputFilePath: string,
    outputFormat: "LIST" | "TABLE",
    sortBy: "GAME_NAME" | "PRICE" | undefined
) => {
    const lines = getLinesFromFile(inputFilePath)

    let outputLines: string[]

    switch (outputFormat) {
        case "TABLE":
            outputLines = await generateOutputTable(lines, sortBy)
            break

        default:
            outputLines = await generateOutputList(lines)
            break
    }

    const outFilePath = generateOutputFilePath(inputFilePath)
    writeFileSync(outFilePath, outputLines.join("\n"))
}

const generateOutputList = async (lines: string[]): Promise<string[]> => {
    const outputLines = await processLines(lines, (gameName, officialPrice, keyshopsPrice) => {
        return `- ${gameName} -> ${officialPrice} | ${keyshopsPrice}`
    })

    return outputLines
}

const generateOutputTable = async (lines: string[], sortBy: "GAME_NAME" | "PRICE" | undefined): Promise<string[]> => {
    const tableHead = [
        "| Game Name | Official Price | Keyshops Price |",
        "|-----------|----------------|----------------|",
    ]

    const outputLines = await processLines(lines, (gameName, officialPrice, keyshopsPrice) => {
        return `| ${gameName} | ${officialPrice} | ${keyshopsPrice} |`
    })

    const alignedOutputTableLines = alignOutputTableColumnWidths(tableHead.concat(outputLines))

    return sortTableLines(alignedOutputTableLines, sortBy)
}
