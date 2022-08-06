const PORT = process.env.PORT || 8000;
const express = require("express");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const randomUseragent = require("random-useragent");

const app = express();

puppeteer.use(StealthPlugin());

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36";

const items = [];

app.get("/", (req, res) => {
  async function asugan() {
    let browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.CHROME_BIN || null,
      args: [
        "--enable-features=NetworkService",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
      ignoreHTTPSErrors: true,
      dumpio: false,
    });
    const [page] = await browser.pages();
    const userAgent = randomUseragent.getRandom();
    const UA = userAgent || USER_AGENT;

    //Randomize viewport size
    await page.setViewport({
      width: 1920 + Math.floor(Math.random() * 100),
      height: 3000 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: false,
      isMobile: false,
    });

    await page.setUserAgent(UA);
    await page.setJavaScriptEnabled(true);
    await page.setDefaultNavigationTimeout(0);
    await page.goto("https://steamdb.info/patchnotes/", {
      waitUntil: "networkidle0",
    });
    const data = await page.evaluate(
      () => document.querySelector("*").outerHTML
    );

    const mydata = cheerio.load(data);
    const items = [];
    mydata("table > tbody > tr").map((i, el) => {
      const tds = mydata(el).find("td");
      const date = mydata(el).find(tds[0]).text().replace(/\n/g, "");
      const image = mydata(el).find(tds[1]).find("img").attr("src");
      const game_name = mydata(el).find(tds[2]).text().replace(/\n/g, "");
      const note = mydata(el).find(tds[3]).text().replace(/\n/g, "");
      const parts = image.split("/");
      const appid = parts[parts.length - 2];

      items.push({
        date,
        game_name,
        note,
        image,
        appid,
      });
    });

    res.json(items);
    await browser.close();
  }
  asugan();
});

app.listen(PORT);
