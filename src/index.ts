#!/usr/bin/env node

import axios from "axios"
import * as cheerio from "cheerio"
import { program } from "commander"
import { exit } from "process"

const isStringTuple = (arr: any): arr is [string, string] => {
    return Array.isArray(arr) && arr.length === 2 && typeof arr[0] === "string" && typeof arr[1] === "string"
}

const getPrice = async (gameName: string) => {
    const response = await axios.get(`https://gg.deals/game/${gameName}`)
    const data = response.data

    const $ = cheerio.load(data)

    const prices = $("div.header-game-prices-content.active")
        .find(".game-info-price-col span.price-inner.numeric")
        .map((_, element) => $(element).text())
        .get()

    if (!isStringTuple(prices)) {
        console.error(`Error while parsing game page data. Game: "${gameName}"`)
        return null
    }

    return prices
}

const printSingleGamePrice = async (gameName: string) => {
    if (!gameName) {
        console.log("No game name given!")
        exit(1)
    }

    const [officialPrice, keyshopsPrice] = await getPrice(gameName)

    console.log(`Official: ${officialPrice}`)
    console.log(`Keyshops: ${keyshopsPrice}`)

    exit()
}

program
    .arguments("<gameName>")
    .description("Specify a game name")
    .action((gameName) => {
        printSingleGamePrice(gameName)
    })

program.parse(process.argv)
