import { chromium } from '@playwright/test'

const browser = await chromium.launch()
const page = await browser.newPage()

const results = await page.evaluate(async () => {
  async function loadImg(url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }
  async function inspect(url) {
    const img = await loadImg(url)
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, 256, 256)
    const { data } = ctx.getImageData(0, 0, 256, 256)
    const counts = new Map()
    for (let i = 0; i < data.length; i += 4) {
      const key = `${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
    return sorted
  }
  const dark = await inspect('https://basemaps.cartocdn.com/dark_nolabels/5/9/12.png')
  const light = await inspect('https://basemaps.cartocdn.com/light_nolabels/5/9/12.png')
  // A tile likely mostly ocean (mid Atlantic-ish) for contrast:
  const darkOcean = await inspect('https://basemaps.cartocdn.com/dark_nolabels/5/16/12.png')
  return { dark, light, darkOcean }
})

console.log(JSON.stringify(results, null, 2))
await browser.close()
