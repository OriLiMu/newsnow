import { Buffer } from "node:buffer"
import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  try {
    // 使用更具体的 RSS URL（中国新闻），并增加超时设置
    const response = await myFetch("https://news.google.com/rss/search?q=when:24h+china&hl=zh-CN&gl=CN&ceid=CN:zh-Hans", {
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

    return news.sort((m, n) => n.pubDate! > m.pubDate! ? 1 : -1)
  } catch (error) {
    console.error("Google News 获取失败:", error)
    // 返回空数组，避免整个应用崩溃
    return []
  }
})
