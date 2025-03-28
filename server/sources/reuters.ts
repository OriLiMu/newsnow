import { Buffer } from "node:buffer"
import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  try {
    // 使用更稳定的路透社中文 RSS URL，并增加超时设置
    const response = await myFetch("https://www.reuters.com/arc/outboundfeeds/v3/rss/world-news/feed-cn?outputType=xml", {
      responseType: "arrayBuffer",
      timeout: 30000, // 增加超时时间到 30 秒
    })

    const xml = Buffer.from(response).toString("utf-8")
    const $ = cheerio.load(xml, { xmlMode: true })
    const news: NewsItem[] = []

    $("item").each((_, el) => {
      const $item = $(el)
      const title = $item.find("title").text()
      const link = $item.find("link").text()
      const pubDate = $item.find("pubDate").text()

      if (title && link && pubDate) {
        news.push({
          id: link,
          title,
          url: link,
          pubDate: new Date(pubDate).valueOf(),
        })
      }
    })

    // 如果没有获取到数据，提供备用数据源
    if (news.length === 0) {
      // 尝试另一个 RSS 源
      try {
        const backupResponse = await myFetch("https://feeds.reuters.com/reuters/topNews", {
          responseType: "arrayBuffer",
          timeout: 30000,
        })

        const backupXml = Buffer.from(backupResponse).toString("utf-8")
        const $backup = cheerio.load(backupXml, { xmlMode: true })

        $backup("item").each((_, el) => {
          const $item = $backup(el)
          const title = $item.find("title").text()
          const link = $item.find("link").text()
          const pubDate = $item.find("pubDate").text()

          if (title && link && pubDate) {
            news.push({
              id: link,
              title,
              url: link,
              pubDate: new Date(pubDate).valueOf(),
            })
          }
        })
      } catch (backupError) {
        console.error("Reuters 备用源获取失败:", backupError)
      }
    }

    return news.sort((m, n) => n.pubDate! > m.pubDate! ? 1 : -1)
  } catch (error) {
    console.error("Reuters 获取失败:", error)
    // 返回空数组，避免整个应用崩溃
    return []
  }
})
