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
