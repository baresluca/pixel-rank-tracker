const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const parse = require('./google_parse');
const importCSV = require('./open_csv');
const dataExport = require('./database_export');
const configFile = require('./config');
const iPhone = devices['iPhone 8']; 



async function scrapeGoogle(keyword){
    let start = new Date().getTime();
    let scrapeUrl = 'https://www.google.com/search?q=' + keyword
    // proxy authentication credentials (should move to file on machine) 
    const proxyUrl = configFile.params.proxyUrl;
    const username = configFile.params.username;
    const password = configFile.params.password;

    const browser = await puppeteer.launch({
        args: [
          `--proxy-server=${proxyUrl}`,
          `--disable-infobars`, 
          '--disable-dev-shm-usage',
          '--disable-plugins-discovery',
          '--profile-directory=Default',],
        headless: true,
    });
const desktopPage = await browser.newPage();
const mobilePage = await browser.newPage();
  await desktopPage.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.50 Safari/537.36')
  await desktopPage.authenticate({ username, password });
  await desktopPage.goto(scrapeUrl);
  
  let desktopSERP = await parse.parseDesktop(desktopPage, keyword); // parse HTML and create array of SERP result objects
  await dataExport.addToDatabase(desktopSERP); // export SERP result objects to pixel_test table in Postgres database
  
  await mobilePage.emulate(iPhone);
  await mobilePage.goto(scrapeUrl);
  
  let mobileSERP = await parse.parseMobile(mobilePage, keyword); // parse HTML and create array of SERP result objects
  await dataExport.addToDatabase(mobileSERP); // export SERP result objects to pixel_test table in Postgres database
  
  
  await browser.close();
  let end = new Date().getTime();
  let time = (end - start) / 1000;
  console.log("This function took " + time + " seconds to complete.")
  
};

keywordList = importCSV.getKeywords('keywords.csv')
async function processArray(array) {
  smallArray = array.slice(528,1422)
  let totalLength = String(smallArray.length);
  let i = 1;
  for (const item of smallArray) {
    console.log("Scraping " + String(i) + " of " + totalLength + ". Keyword we're scraping is: " + item)
    await scrapeGoogle(item[0]);

    i++;
  }
  console.log('Done!');
  dataExport.endPool();

}

processArray(keywordList);


