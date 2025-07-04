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
        response = await axios.get(`https://gg.deals/game/${normalizedGameName}`, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                Connection: "keep-alive",
            },
        })
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
