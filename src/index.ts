#!/usr/bin/env node

import axios from "axios"
import * as cheerio from "cheerio"
import { exit } from "process"
import * as readline from "readline/promises"

const getPrice = async (gameName: string) => {
    const response = await axios.get(`https://gg.deals/game/${gameName}`)
    const data = response.data

    const $ = cheerio.load(data)

    const prices = $("div.header-game-prices-content.active")
        .find(".game-info-price-col span.price-inner.numeric")
        .map((_, element) => $(element).text())
        .get()

    return prices
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

const main = async () => {
    const gameName = await rl.question("What game do you want to check the price? ")

    if (!gameName) {
        console.log("No game name given!")
        exit(1)
    }

    const [officialPrice, keyshopsPrice] = await getPrice(gameName)

    console.log(`Official: ${officialPrice}`)
    console.log(`Keyshops: ${keyshopsPrice}`)

    exit()
}

main()
