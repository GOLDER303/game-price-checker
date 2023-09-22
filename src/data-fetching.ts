import axios, { AxiosError, AxiosResponse } from "axios"
import * as cheerio from "cheerio"
import { isStringTuple, normalizeGameName } from "./data-fetching-utils"

export const getGamePrice = async (gameName: string): Promise<[string, string] | null> => {
    if (!gameName) {
        console.error("Game name is empty")
        return null
    }

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
