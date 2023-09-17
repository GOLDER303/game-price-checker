import { readFileSync } from "fs"
import path from "path"
import { getGamePrice } from "./data-fetching"

export const alignOutputTableColumnWidths = (lines: string[]): string[] => {
    const columnWidths: number[] = []

    lines.forEach((line) => {
        const columns = line.split("|").map((col) => col.trim())

        columns.forEach((col, colIndex) => {
            columnWidths[colIndex] = Math.max(columnWidths[colIndex] || 0, col.length)
        })
    })

    let separatingLine = "|"

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

        const paddedColumnsLine = paddedColumns.join(" | ")
        return paddedColumnsLine.substring(1, paddedColumnsLine.length - 1)
    })

    equalizedLines[1] = separatingLine

    return equalizedLines
}

const getGameNameFromLine = (line: string): string => {
    let gameName = line

    if (line.startsWith("-")) {
        gameName = line.substring(1, line.length)
    }

    return gameName
}

export const processLines = async (
    lines: string[],
    generateLine: (gameName: string, officialPrice: string, keyshopsPrice: string) => string
): Promise<string[]> => {
    const outputLines: string[] = []

    for (const line of lines) {
        const gameName = getGameNameFromLine(line)

        const gamePrice = await getGamePrice(gameName)
        if (!gamePrice) {
            continue
        }
        const [officialPrice, keyshopsPrice] = gamePrice

        outputLines.push(generateLine(gameName, officialPrice, keyshopsPrice))
    }

    return outputLines
}

export const getLinesFromFile = (inputFilePath: string): string[] => {
    const inputFile = readFileSync(inputFilePath).toString()

    let lines: string[]
    if (inputFile.includes("\r")) {
        lines = inputFile.split("\r\n")
    } else {
        lines = inputFile.split("\n")
    }

    return lines
}

export const generateOutputFilePath = (inputFilePath: string): string => {
    const inputFileName = path.parse(path.basename(inputFilePath)).name

    const outFile = path.join(path.dirname(inputFilePath), `${inputFileName}_out${path.extname(inputFilePath)}`)

    return outFile
}
