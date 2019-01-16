/* eslint-env jest */

const puppeteer = require('puppeteer')
let browser
let page

beforeEach( async (done) => {
  browser = await puppeteer.launch({headless: false})
  page = await browser.newPage()
  done()
})

afterEach(async (done) => {
  await page.close();
  await browser.close();
  done();
})

it('passes all tests', async (done) => {
  // TODO: make this a generic url to work locally or in Travis
  // await page.goto('file:///Users/alistairlaing/work/fourth-wall/spec/index.html')
  await page.goto('http://localhost:8000/spec/index.html')
  await page.waitForSelector('.passingAlert')
  const passed = await page.evaluate( () => document.querySelector('.passingAlert').textContent )

  expect(passed).toEqual('Passing 54 specs')
  done()
})
