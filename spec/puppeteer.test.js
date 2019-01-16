const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  // TODO: make this a generic url to work locally or in Travis
  await page.goto('file:///Users/alistairlaing/work/fourth-wall/spec/index.html')
  await page.screenshot({path: 'example.png'})
  await page.waitForSelector('.alert')
  await page.evaluate(() => { return document.body.querySelector('passingAlert')})
  await page.screenshot({path: 'example1.png'})
  await browser.close();
})()
