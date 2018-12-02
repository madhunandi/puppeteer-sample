const puppeteer = require("puppeteer-core");
const chrome = require("@serverless-chrome/lambda");
const request = require("superagent");
const process = require("process");
const aws = require("aws-sdk");
const dynamoDB = new aws.DynamoDB();

const walkinDetails = async (event, context, callback) => {
  try {
    const instance = await chrome({
      headless: !!process.env.IS_LOCAL
    });

    const response = await request
      .get(`${instance.url}/json/version`)
      .set("Content-Type", "application/json");

    const { webSocketDebuggerUrl: browserWSEndpoint } = response.body;

    const browser = await puppeteer.connect({
      browserWSEndpoint
    });

    const page = await browser.newPage();
    await page.goto("https://www.naukri.com/react-jobs");

    const allCompanies = await page.$$eval(".orgRating .org", el =>
      el.map(e => e.innerText)
    );

    const allCompanyIds = await page.$$eval("div[type='tuple']", el =>
      el.map(e => e.id)
    );

    const allCompaniesUrl = await page.$$eval("div[type=tuple]", el =>
      el.map(({ dataset: { url } }) => url)
    );

    let finalArray = [];
    for (let [i, dataurl] of allCompaniesUrl.entries()) {
      if (i >= 5) {
        break;
      }
      await page.goto(dataurl);
      const [jobDescriptionElement] = await page.$x(
        "//h2[contains(text(), 'Job Description')]/parent::div/following-sibling::*"
      );
      const jobDescription = await page.evaluate(
        ({ textContent }) => textContent,
        jobDescriptionElement
      );
      const tempObj = {
        PutRequest: {
          Item: {
            id: {
              S: allCompanyIds[i]
            },
            company: {
              S: allCompanies[i]
            },
            url: {
              S: dataurl
            },
            description: {
              S: jobDescription || `No Job Description`
            }
          }
        }
      };
      finalArray.push(tempObj);
    }
    console.log(finalArray);
    await browser.close();
    const params = {
      RequestItems: {
        WalkinStore: finalArray
      }
    };
    await dynamoDB.batchWriteItem(params).promise();
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(finalArray)
    });
  } catch (error) {
    console.log(error);
    callback(error);
  }
};

module.exports.walkinDetails = walkinDetails;
