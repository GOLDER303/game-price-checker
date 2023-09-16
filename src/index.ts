#!/usr/bin/env node

import axios, { AxiosError, AxiosResponse } from "axios"
import * as cheerio from "cheerio"
import { program } from "commander"
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

program
    .arguments("<gameName>")
    .description("Specify a game name")
    .action((gameName) => {
        printSingleGamePrice(gameName)
    })

program.parse(process.argv)
