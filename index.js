const puppeteer = require("puppeteer");
const process = require("process");

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false
    });
    const page = await browser.newPage();
    await page.goto("https://www.naukri.com/react-jobs");
    
    const allCompanies = await page.$$eval('.orgRating .org');

    console.log(allCompanies);

    await browser.close();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();
