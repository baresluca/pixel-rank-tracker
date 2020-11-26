// tools.js
// ========

// gets and returns date and time into strings 
function getDatetime(){
  let datetime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  datetime = datetime.split(' ');
  let date = datetime[0];
  let time = datetime[1];
  return [date, time]
}

// sorts SERP object array by horizontal position
function sortFunction(a, b) {
  return a['horizontal position'] - b['horizontal position'];
}

// build regex literal for checking matches within string data
class MyRegExp extends RegExp {
  [Symbol.matchAll](str) {
      let result = RegExp.prototype[Symbol.matchAll].call(this, str);
      if (!result) {
          return null;
      }
      return Array.from(result);
  }
}

// create regex pattern and check HTML for a match
function checkMatch(regexPattern, html){
  let re = new MyRegExp(regexPattern, 'g');
  let matchArray = html.matchAll(re);
  return matchArray;
}

// Return match type if match exists for organic results
function changeType(regexPattern, html, addType){
  htmlMatches = checkMatch(regexPattern, html);
  if(htmlMatches != undefined && htmlMatches.length > 0){
    return addType;
  }
  else{
    return []
  }
}

// determine what type of mobile organic result is present
function getDesktopOrganicType(html){
  let type = [];
  largeSitelinks = changeType('<table class="nrgt"', html, 'large-sitelinks');
  forumSitelinks = changeType('<div class="P1usbc".*?<div class="VNLkW">.*?<a class="fl"', html, 'forum-links');
  reviewRichSnippet = changeType('<div class="dhIWPd f".*?g-review-stars>', html, 'review-rich-snippet');

  type.push(largeSitelinks);
  type.push(forumSitelinks);
  type.push(reviewRichSnippet);


  let flatTypeArr = type.filter(function (el) {
    return el.length > 0;
  });

  return flatTypeArr
}

async function getSerpObject(innerOrganic, keyword, device, rank){
  let pixelPosition = await innerOrganic.boundingBox();
  let height = Math.round(pixelPosition['height']);
  let width = Math.round(pixelPosition['width']);
  let xPosition = Math.round(pixelPosition['x']);
  let yPosition = Math.round(pixelPosition['y']); 
  let [date, time] = getDatetime();
  
  let serpObject = {
    'date': date,
    'time': time,
    'keyword': keyword,
    'device': device,
    'element type': 'organic',
    'organic rank': rank,
    'height': height,
    'width': width,
    'vertical position': xPosition,
    'horizontal position': yPosition,
  }
  return serpObject;
}

// determine what type of mobile organic result is present
function getMobileOrganicType(html){
  let type = [];
  imageThumbnail = changeType('<g-img.*?class="BA0A6c onqIhd">', html, 'image-thumbnail');
  cardCarousel = changeType('<g-inner-card', html, 'card-carousel');
  imageCarousel = changeType('<div class="v8dWLe">', html, 'image-carousel');
  imageSitelinks = changeType('<g-scrolling-carousel.*?<a.*?<g-img', html, 'image-sitelinks');
  textSitelinks = changeType(/<g-scrolling-carousel.*?<div.*?class="mR2gOd Y3nRse".*?[<div class="nVmm2c">[\w\s]*<\/div><\/div>|<span class="MUxGbd">/, html, 'text-sitelinks');
  videoThumbnail = changeType('<div class="r1kGaJjQkr0__video-web-result"', html, 'video-thumbnail');
  largeSitelinks = changeType('<div class="Lgnr0e J88qA vgnU9e BmP5tf"', html, 'large-sitelinks');
  contentSlider = changeType(/<g-scrolling-carousel.*?<div.*?class="N0fvXd dJMePd zDBTmf"/, html, 'content-slider');
  
  type.push(imageThumbnail);
  type.push(imageCarousel);
  type.push(cardCarousel);
  type.push(imageSitelinks)
  type.push(textSitelinks)
  type.push(videoThumbnail)
  type.push(largeSitelinks)
  type.push(contentSlider)
  
    let flatTypeArr = type.filter(function (el) {
      return el.length > 0;
    });
    
    return flatTypeArr
  }
  
  
  async function organicResultsDesktop(page, keyword){
    let rankCounter = 1;
    let organicRanks = [];
    const outerOrganic = await page.$$('div#search div.g');
    for (const innerOrganic of outerOrganic){
      try {
        let innerHTML = await innerOrganic.$eval('div.rc div.r', div => div.innerText);
        if(innerHTML.length > 0){
          // find type of organic listing
          let html = await innerOrganic.evaluate(div => div.innerHTML, innerOrganic);  
          let organicType = getDesktopOrganicType(html);
          
          let link = await innerOrganic.$eval('div.rc div.r a', a => a.href);
          
          // build SERP Object and add dependent data to object
          serpObject = await getSerpObject(innerOrganic, keyword,'desktop', rankCounter);
          serpObject['url'] = link;
          serpObject['organic type'] = organicType;
          
          organicRanks.push(serpObject)
          rankCounter += 1;
      } 
      
    } 
    catch (error) {
      try{  
        let innerHTML = await innerOrganic.$eval('div.s', div => div.innerText);
        if(innerHTML.length > 0){
          let link = await innerOrganic.$eval('g-link a', a => a.href);
          
          serpObject = await getSerpObject(innerOrganic, keyword,'desktop', rankCounter);
          serpObject['url'] = link;
          serpObject['organic type'] = 'organic';
  
  
          organicRanks.push(serpObject)
          rankCounter += 1;
        }
      } 
      catch(error){
      }
    }
  }
  return organicRanks;
}



// get all organic result positions + pixel positions 
async function organicResultsMobile(page, keyword){
  let rankCounter = 1;
  let organicRanks = [];
  
  const outerOrganic = await page.$$('div.mnr-c.xpd.O9g5cc.uUPGi');
  for (const innerOrganic of outerOrganic){
    try {
      let innerHTML = await innerOrganic.$eval('div.KJDcUb', div => div.innerText);
      try{
        let adSpan = await innerOrganic.$eval('div.KJDcUb span.p8AiDd', span => span.innerText);
        console.log(adSpan)
      }
      catch{
        if(innerHTML.length > 0){
          let html = await innerOrganic.evaluate(div => div.innerHTML, innerOrganic);  
          let organicType = getMobileOrganicType(html);
          
          let link = await innerOrganic.$eval('div.KJDcUb a', a => a.href);
          let pixelPosition = await innerOrganic.boundingBox();
          let rank = rankCounter;
          let height = Math.round(pixelPosition['height']);
          let width = Math.round(pixelPosition['width']);
          let xPosition = Math.round(pixelPosition['x']);
          let yPosition = Math.round(pixelPosition['y']); 
          let [date, time] = getDatetime();
          

          let serpObject = {
            'date': date,
            'time': time,
            'keyword':keyword,
            'device': "mobile",
            'element type': 'organic',
            'organic type': organicType,
            'organic rank': rank,
            'height': height,
            'width': width,
            'vertical position': xPosition,
            'horizontal position': yPosition,
            'url': link,
          }
          organicRanks.push(serpObject)
          rankCounter += 1;
        } 
      }
    } 
    catch (error) {
      
    }
  }
  return organicRanks;
}

// uses CSS paths to identify and select divs within HTML to create SERP objects from
async function htmlParse(page, cssPath, elemType, keyword, device){
  let serpRanks = [];
  const scrapedHTML = await page.$$(cssPath);
  let [date, time] = getDatetime();

  for (const row of scrapedHTML){
    let link = 'https://www.google.com';
    let pixelPosition = await row.boundingBox();
    let height = Math.round(pixelPosition['height']);
    let width = Math.round(pixelPosition['width']);
    let xPosition = Math.round(pixelPosition['x']);
    let yPosition = Math.round(pixelPosition['y']); 

    let serpObject = {
      'date': date,
      'time': time,
      'keyword':keyword,
      'device': device,
      'organic rank': 0,
      'element type': elemType,
      'organic type': 'NULL',
      'height': height,
      'width': width,
      'vertical position': xPosition,
      'horizontal position': yPosition,
      'url': link,
    }
    serpRanks.push(serpObject);
  }
  return serpRanks;
}

// look for text to match/parse though
async function htmlParseText(page, cssPath, text, headerType, elemType, keyword, device){
  let serpRanks = [];
  
  const outerOrganic = await page.$$(cssPath);
  for (const innerOrganic of outerOrganic){
    
    try {
      let innerHTML = await innerOrganic.$eval(headerType, elem => elem.innerText);
      if(innerHTML.includes(text)){
  
        let pixelPosition = await innerOrganic.boundingBox();
        let height = Math.round(pixelPosition['height']);
        let width = Math.round(pixelPosition['width']);
        let xPosition = Math.round(pixelPosition['x']);
        let yPosition = Math.round(pixelPosition['y']); 
        let [date, time] = getDatetime();
    
        let serpObject = {
          'date': date,
          'time': time,
          'keyword':keyword,
          'device': device,
          'element type': elemType,
          'organic type': 'NULL',
          'organic rank': 0,
          'height': height,
          'width': width,
          'vertical position': xPosition,
          'horizontal position': yPosition,
          'url': "https://www.google.com",
        }
        serpRanks.push(serpObject)
      } 
    } 
    catch (error) {
    }


  }
  return serpRanks;
}


// parses through HTML of page, creates SERP object for each SERP feature/organic result and adds to a SERP object array
async function parseDesktop(page, keyword){
  let organicResults = await organicResultsDesktop(page, keyword);
  let plas = await htmlParse(page, 'div.cu-container',"pla", keyword, "desktop");
  let googleAd = await htmlParse(page, 'li.ads-ad', 'google ad', keyword, "desktop");
  let mapPack = await htmlParse(page, 'div.AEprdc.vk_c', 'map pack', keyword, "desktop");
  let peopleAlsoAsk = await htmlParse(page, 'div.kp-blk.cUnQKe.Wnoohf.OJXvsb',"people also ask", keyword, "desktop");
  let discoverMorePlaces = await htmlParse(page, 'div.mnr-c.uOaWdb',"discover more places", keyword, "desktop");
  let featuredSnippet = await htmlParse(page, 'div.g.mnr-c.g-blk div.xpdopen div.ifM9O>div>div.NFQFxe.viOShc.mod','featured snippet', keyword, "desktop");
  let featuredSnippet2 = await htmlParse(page, 'div.g.mnr-c.g-blk div.xpdopen div.ifM9O>div>div.NFQFxe.EfDVh.mod','featured snippet', keyword, "desktop");
  let knowledgePanel = await htmlParse(page, 'div.kp-blk.knowledge-panel.Wnoohf.OJXvsb','knowledge panel', keyword, "desktop");    
  let imageBlock = await htmlParse(page, 'div.bkWMgd div.LnbJhc', 'image block', keyword, "desktop" );
  let relatedSearches = await htmlParse(page, 'div#botstuff div#brs', 'related searches', keyword, "desktop");
  let flights = await htmlParse(page, 'g-card.gFsvSd','flights', keyword, "desktop");
  let refineBy = await htmlParse(page, 'div.bkWMgd g-card.g.Bc0X2', 'refine by', keyword, "desktop");
  let jobs = await htmlParseText(page, 'g-card.URhAHe div.k9uN1c.kfn9hb', 'Jobs', 'g-tray-header span', 'jobs', keyword, "desktop");
  let twitterBlock = await htmlParseText(page, 'div.bkWMgd', "Twitter Results", "h2", 'twitter results', keyword, "desktop");
  let topStories = await htmlParseText(page, 'div.bkWMgd', 'Top stories',"h3", 'top stories', keyword, "desktop");
  let videoBlock = await htmlParseText(page, 'g-section-with-header', "Videos", "h3", 'video block', keyword, "desktop");

  
  // adds all scraped SERP features into one array   
  serpArray = [plas, mapPack, peopleAlsoAsk, discoverMorePlaces, featuredSnippet, featuredSnippet2, knowledgePanel, imageBlock, relatedSearches, flights, refineBy, topStories, videoBlock, googleAd, jobs, twitterBlock, topStories]
  
  // adds organic results to SERP array to create a full SERP array
  fullSerp = serpArray.concat(organicResults)
  fullSerp = fullSerp.flat() //flattens object array to create a one dimensional SERP array
  
  // sorts serp object by horizontal height
  const sortedSerp = fullSerp.sort(sortFunction)
  return sortedSerp;
}




// parses through HTML of page, creates SERP object for each SERP feature/organic result and adds to a SERP object array
async function parseMobile(page, keyword){
  let organicSERPResults = await organicResultsMobile(page, keyword);
  let plas = await htmlParse(page, 'div#taw div.qs-ir',"pla", keyword, "mobile");
  let mapPack = await htmlParse(page, 'div.mnr-c.oTbp6b', 'map pack', keyword, "mobile");
  let peopleAlsoAsk = await htmlParse(page, 'div.g.kno-result.rQUFld.kno-kp.mnr-c.g-blk',"people also ask", keyword, "mobile");
  let discoverMorePlaces = await htmlParse(page, 'div.mnr-c.uOaWdb',"discover more places", keyword, "mobile");
  let featuredSnippet = await htmlParse(page, 'div.kp-blk.c2xzTb.OJXvsb','featured snippet', keyword, "mobile");
  let knowledgePanel = await htmlParse(page, 'div.kp-wholepage.EyBRub.pEZBSb.kp-wholepage-osrp','knowledge graph', keyword, "mobile");    
  let imageBlock = await htmlParse(page, 'div.bUNBRd.mnr-c','image block', keyword, "mobile" );
  let relatedSearches = await htmlParse(page, 'div#bres','related searches', keyword, "mobile");
  let refineBy = await htmlParse(page, 'div.g div.Eee1Bd','refine by', keyword, "mobile");
  let topStories = await await htmlParse(page, 'div.uYLvId', 'top stories', keyword, "mobile");
  let videoBlock = await htmlParse(page, 'div.HD8Pae.mnr-c.xpd.O9g5cc.uUPGi', 'video block', keyword, "mobile");
  let interestingFinds = await htmlParse(page, 'g-card.I7zR5', 'interesting finds', keyword, "mobile");
  let popularProducts = await htmlParse(page, 'nav.baPFxb.g.kSMK2 g-card div.bUNBRd.mnr-c', 'popular products', keyword, "mobile");
  let searchByPhotos = await htmlParse(page, 'div.vzROO.mnr-c', 'search by photos', keyword, "mobile");
  let googleAd = await htmlParse(page, 'li.ads-fr', 'google ads', keyword, "mobile");
  let researchCarousel = await htmlParse(page, 'g-card.g.sKE3C', 'research carousel', keyword, "mobile");
  
  // adds all scraped SERP features into one array   
  serpArray = [plas, mapPack, peopleAlsoAsk, discoverMorePlaces, featuredSnippet, knowledgePanel, imageBlock, relatedSearches, refineBy, topStories, videoBlock, interestingFinds, popularProducts, searchByPhotos, googleAd, researchCarousel]
  
  // adds organic results to SERP array to create a full SERP array
  fullSerp = serpArray.concat(organicSERPResults)
  fullSerp = fullSerp.flat() //flattens object array to create a one dimensional SERP array
  
  // sorts serp object by horizontal height
  const sortedSerp = fullSerp.sort(sortFunction)
  return sortedSerp;
}
 
module.exports = {
    parseDesktop: async function(page, keyword){
      let desktopSerpObject = await parseDesktop(page, keyword);
      return desktopSerpObject;
    },
    parseMobile: async function(page, keyword){
      let mobileSerpObject = await parseMobile(page, keyword);
      return mobileSerpObject;
    }
  };
  


