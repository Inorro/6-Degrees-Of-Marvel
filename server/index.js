const express = require("express"); //Importing express package for backend
const app = express(); //intializing app instance
const cors = require("cors"); // cors is needed to connect to frontend
const mysql = require("mysql2")
const axios = require("axios");
const cheerio = require("cheerio");
const { Pool } = require("pg");
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const port = process.env.PORT || 4000;

app.use(cors());

var database = null
var recursiveQuit = 0

async function getData() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT * FROM characters');
    database = rows
    return rows
  } finally {
    client.release();
  }
}
getData()


var newnotable = require('./newnotable.json'); //Loading a map of notable characters with large appearance sets to prioritize when searching for connections
var notableurls = [] //All the appearance pages for those characters

newnotable.forEach(notable => {
  notableurls.push(notable.url)
})

app.get("/scrape", async (req, res) => { //Initial Api Call function
  //console.log("HEree")
  recursiveQuit = 0
  try {
    const data = req.query;
    let [items1, items2] = [data.url1.split("/"), data.url2.split("/")]
    var [intersection, setA, setB] = await initialIntersection(items1, items2) //Manipulates string urls for scraping and calls function on line 67

    if (Array.from(intersection).length == 0) { // If there is no direct connection
      secondCheck = await checkCommonCharacters(setA, setB, data.name1, data.name2) // Calling function on line 120

      if (secondCheck.constructor === Array) {
        res.json(secondCheck)//If connection found send to frontend
      } else {
        res.json("No Appearances")
      }
    } else {
      res.json(Array.from(intersection))
    }
  } catch (err) {
    console.error(err);
    res.json("No Appearances")
  }
});

async function initialIntersection(items1, items2) { // Checks if inputted characters have a direct intersection of appearances
  let [firsth1, firsth2] = [items1.slice(0, 4), items2.slice(0, 4)]
  let [sech1, sech2] = ["/Category:" + items1[4] + "/Appearances", "/Category:" + items2[4] + "/Appearances"]
  let appearanceUrls = [firsth1.join("/") + sech1, firsth2.join("/") + sech2]
  // Url manipulation
  let appearanceArrays = []
  for (let i = 0; i < appearanceUrls.length; i++) { // Loop scraper function for each page of appearances per character
    let flag = true;
    let applist = []
    let first, second
    while (flag) {
      [first, second] = await scraper(appearanceUrls[i]) // Function at line 93
      applist.push(...first)

      if (second == "EXIT") {
        break
      } else {
        appearanceUrls[i] = second
      }
    }
    appearanceArrays.push(applist)
  }
  var [setA, setB] = [new Set(appearanceArrays[0]), new Set(appearanceArrays[1])] // Converts the two arrrays of appearances returned into sets for efficientcy in finding the intersection 
  return [new Set([...setA].filter(x => setB.has(x))), setA, setB] //Returns the intersection between appearances and each set of appearances
}

async function scraper(url) { //Uses Cheerio library to scrape each page of characters appearance
  const { data } = await axios.get(url);

  if (notableurls.indexOf(url) > -1) { //If one of the inputted characters is part of the notable characters list return their appearance list without scraping
    let result = newnotable.filter(obj => {
      return obj.url === url
    })
    return [result[0].appearances, "EXIT"]
  }
  let applist = []
  let $ = cheerio.load(data);
  let appearances = $(".category-page__member-link"); // <a> tags that are used for appearances on the wiki
  //console.log(appearances.text())
  appearances.each(function (i, elem) { // removing junk valus from the array
    if (!$(this).text().includes("Category:") && !$(this).text().includes("(magazine)")) {
      applist.push($(this).text())
    }
  });
  let nextpg = $(".category-page__pagination-next.wds-button.wds-is-secondary").attr("href"); //Checking for multiple pages

  if (nextpg) { // Returns appearance array
    return [applist, nextpg]
  } else {
    return [applist, "EXIT"]
  }
}

function checkCommonCharacters(setA, setB, nameA, nameB) {//Function simply checks if one of the notable appearances connects both inputted characters
  var [firstConns, secConns] = [[], []]

  newnotable.forEach(notable => { //Goes through notable characters and creates 2 arrays of available common connection with setA and setB
    let setApps = new Set(notable.appearances)
    var [intersectionA, intersectionB] = [new Set([...setA].filter(x => setApps.has(x))), new Set([...setB].filter(x => setApps.has(x)))]
    if (Array.from(intersectionA).length > 0 && notable.name !== nameA) {
      firstConns.push({ [notable.name]: Array.from(intersectionA) })
    }
    if (Array.from(intersectionB).length > 0 && notable.name !== nameB) {
      secConns.push({ [notable.name]: Array.from(intersectionB) })
    }
  })
  let firstConnKeys = firstConns.map(x => Object.keys(x)[0]);
  let secConnKeys = secConns.map(x => Object.keys(x)[0]);
  availableConnections = firstConnKeys.filter(value => secConnKeys.includes(value))

  if (availableConnections.length > 0) {//If there is a common notable character between the two the function on line 144 is called to find the best one
    let [bestKey, bestAConnections, bestBConnections] = BestCommonIntersection(firstConns, secConns, availableConnections)
    return ["Second-Degree", newnotable.find(item => item.name === bestKey).imgUrl, bestAConnections, bestBConnections, bestKey]
  }
  return uncommonConnections(setA, setB, firstConns, secConns)// If there is no direct common connection then the function on line 162 is called
}

function BestCommonIntersection(arrA, arrB, intersect) {//Finds the common characters with the most appearances with both character A and B combined
  let max = []
  var [bestA, bestB] = [[], []]
  let bestIntersect = ""
  for (let i = 0; i < intersect.length; i++) {
    let cons1 = arrA.find(el => el[intersect[i]])
    let cons2 = arrB.find(el => el[intersect[i]])

    if (Object.values(cons1)[0].concat(Object.values(cons2)[0]).length > max.length) {
      max = Object.values(cons1)[0].concat(Object.values(cons2)[0])
      bestA = Object.values(cons1)[0]
      bestB = Object.values(cons2)[0]
      bestIntersect = intersect[i]
    }
  }
  return [bestIntersect, bestA, bestB]
}

async function uncommonConnections(setA, setB, commonConnectionsA, commonConnectionsB) {
  var [arrA, arrB] = [Array.from(setA), Array.from(setB)]
  let [appearanceArrayA, connectiveIssuesA, imgUrlA, firstConnectionNameA, changeCheckA] = [[], [], "", "", "CHANGE"]
  let [appearanceArrayB, connectiveIssuesB, imgUrlB, firstConnectionNameB, changeCheckB] = [[], [], "", "", "CHANGE"]
  var appearanceSetA, intersectionA
  var appearanceSetB, intersectionB
  //Initializing the variables used in this function

  let i = 0
  while (changeCheckA == "CHANGE") {
    [appearanceArrayA, connectiveIssuesA, imgUrlA, firstConnectionNameA, changeCheckA] = await findDirectConnection(arrA, i) // Calling the function on line 282 to get the first direct connection of character A, and all important data associated with that connection
    i++
  }
  appearanceSetA = new Set(appearanceArrayA)
  intersectionA = new Set([...appearanceSetA].filter(x => setB.has(x)));//Checks if that connection is shared with character B and returns the connection if so
  if (Array.from(intersectionA).length > 0) {
    return ["Second-Degree", imgUrlA, connectiveIssuesA, Array.from(intersectionA), firstConnectionNameA]
  }

  i = 0
  while (changeCheckB == "CHANGE") {
    [appearanceArrayB, connectiveIssuesB, imgUrlB, firstConnectionNameB, changeCheckB] = await findDirectConnection(arrB, i)// Same logic as before but with character B
    i++
  }
  appearanceSetB = new Set(appearanceArrayB)
  intersectionB = new Set([...appearanceSetB].filter(x => setA.has(x)));
  if (Array.from(intersectionB).length > 0) {
    return ["Second-Degree", imgUrlB, Array.from(intersectionB), connectiveIssuesB, firstConnectionNameB]
  }

  //(3 degrees of separation)

  if (commonConnectionsA.length > 0 && commonConnectionsB.length > 0) {//If there is no direct connection with character A and B and if both A and B have notable connections than this if block finds the connection between the two notable connections
    let NotableAppearanceSetA, NotableAppearanceSetB
    let CommonConnectNameA, CommonConnectNameB
    let CommonConnectUrlA, CommonConnectUrlB
    commonConnectionsA.some(element => {
      CommonConnectNameA = Object.keys(element)[0]
      connectiveIssuesA = Object.values(element)[0]
      NotableAppearanceSetA = new Set(newnotable.find(item => item.name === CommonConnectNameA).appearances)
      CommonConnectUrlA = newnotable.find(item => item.name === CommonConnectNameA).imgUrl
      commonConnectionsB.some(element2 => {
        CommonConnectNameB = Object.keys(element2)[0]
        connectiveIssuesB = Object.values(element2)[0]
        NotableAppearanceSetB = new Set(newnotable.find(item => item.name === CommonConnectNameB).appearances)
        CommonConnectUrlB = newnotable.find(item => item.name === CommonConnectNameB).imgUrl
        intersect = new Set([...NotableAppearanceSetA].filter(x => NotableAppearanceSetB.has(x)));
        if (Array.from(intersect).length > 0) {
          return intersect
        }
      })
    })
    //console.log(intersect)
    if (Array.from(intersect).length > 0) {

      return ["Third-Degree", CommonConnectUrlA, CommonConnectUrlB, connectiveIssuesA, Array.from(intersect), connectiveIssuesB, CommonConnectNameA, CommonConnectNameB]
    }
  } else if (commonConnectionsA.length > 0 && commonConnectionsB.length == 0) { // This if block checks if there is a connection between character A's notable connections and character B's direct connection
    var intersect, CommonConnectName, CommonConnectUrl, elementSet
    commonConnectionsA.some(element => {
      connectiveIssuesA = Object.values(element)[0]
      CommonConnectName = Object.keys(element)[0]
      elementSet = new Set(newnotable.find(item => item.name === CommonConnectName).appearances)
      CommonConnectUrl = newnotable.find(item => item.name === CommonConnectName).imgUrl
      intersect = new Set([...appearanceSetB].filter(x => elementSet.has(x)));
      if (Array.from(intersect).length > 0) {
        return intersect
      }
    })
    if (Array.from(intersect).length > 0) {

      return ["Third-Degree", CommonConnectUrl, imgUrlB, connectiveIssuesA, Array.from(intersect), connectiveIssuesB, CommonConnectName, firstConnectionNameB]
    }
  } else if (commonConnectionsB.length > 0 && commonConnectionsA.length == 0) { // See else if block above but vice versa
    //console.log(appearanceSetA)
    var intersect, CommonConnectName, CommonConnectUrl, elementSet
    commonConnectionsB.some(element => {
      connectiveIssuesB = Object.values(element)[0]
      CommonConnectName = Object.keys(element)[0]
      elementSet = new Set(newnotable.find(item => item.name === CommonConnectName).appearances)
      CommonConnectUrl = newnotable.find(item => item.name === CommonConnectName).imgUrl
      intersect = new Set([...appearanceSetA].filter(x => elementSet.has(x)));

      if (Array.from(intersect).length > 0) {
        return intersect
      }
    })
    if (Array.from(intersect).length > 0) {
      return ["Third-Degree", imgUrlA, CommonConnectUrl, connectiveIssuesA, Array.from(intersect), connectiveIssuesB, firstConnectionNameA, CommonConnectName]
    }
  }

  var thirdDegIntersection = new Set([...appearanceSetA].filter(x => appearanceSetB.has(x))); //Checks if both direct connections have a connection

  if (Array.from(thirdDegIntersection).length == 0) {//If there is no found third degree connection
    if (recursiveQuit === 5) {//Avoids infinite recursion
      return null
    }
    var nextDegree
    recursiveQuit += 1

    if (commonConnectionsA.length > 0) {
      [appearanceSetA, firstConnectionNameA, imgUrlA] = IdealNotableCharacter(commonConnectionsA)//Function called on line 355
    }

    if (commonConnectionsB.length > 0) {
      [appearanceSetB, firstConnectionNameB, imgUrlB] = IdealNotableCharacter(commonConnectionsB)
    }

    nextDegree = await checkCommonCharacters(appearanceSetA, appearanceSetB, firstConnectionNameA, firstConnectionNameB) //Recursive calls function to find connections between the best A and B connection

    if (nextDegree[0] == "Second-Degree") { //If the recursive call find a second-degree connection return a Fourth-Degree connection
      return ["Fourth-Degree", imgUrlA, imgUrlB, nextDegree[1], connectiveIssuesA, nextDegree[2], nextDegree[3], connectiveIssuesB, firstConnectionNameA, firstConnectionNameB, nextDegree[4]]
    } else if (nextDegree[0] == "Third-Degree") {//If the recursive call find a Third-Degree connection return a Fifth-Degree connection
      return ["Fifth-Degree", ...nextDegree.slice(1, 3), imgUrlA, imgUrlB, ...nextDegree.slice(3, 6), connectiveIssuesA, connectiveIssuesB, ...nextDegree.slice(6), firstConnectionNameA, firstConnectionNameB]
    }
  } else { //If both direct connections have a direct connection
    return ["Third-Degree", imgUrlA, imgUrlB, connectiveIssuesA, Array.from(thirdDegIntersection), connectiveIssuesB, firstConnectionNameA, firstConnectionNameB]
  }
}

async function findDirectConnection(arr, indexToCheck) {// Finding the best direct connection of an inputted character
  var devolumedAppearanceArray = arr.map(x => x.slice(0, x.indexOf("Vol")).trim());//Gets array of appearances titles alone
  async function modeAppearanceAndUrl(inputArr) {
    modeIssueTitle = inputArr.sort((a, b) =>
      inputArr.filter(v => v === a).length
      - inputArr.filter(v => v === b).length
    ).pop(); // Finds the most common issue title for a characters appearance and returns it as a String
    let connectiveIssue = ""

    // When the index to check value is 0 this if block will assign modeIssueTitle to modeIssue which is the later used to find the actual first issue with that title later
    // However if there is a recursive loop caused by a characters ideal direct connection being a dead end then the change check shifts the mode issue by one
    if (devolumedAppearanceArray.indexOf(modeIssueTitle) > 0) {
      connectiveIssue = arr[devolumedAppearanceArray.indexOf(modeIssueTitle) - indexToCheck]

    } else if (devolumedAppearanceArray.indexOf(modeIssueTitle) == 0 && devolumedAppearanceArray.length > 1) {
      connectiveIssue = arr[devolumedAppearanceArray.indexOf(modeIssueTitle) + indexToCheck]
    } else {
      connectiveIssue = arr[devolumedAppearanceArray.indexOf(modeIssueTitle)]
    }

    url = "https://marvel.fandom.com/wiki/" + connectiveIssue.replace(/ /g, "_");
    const { data } = await axios.get(url);
    let $ = cheerio.load(data);
    return [arr[connectiveIssue], $("div.mw-parser-output").find('ul > li > a').toArray().map(element => $(element).attr('href'))]//Gets array of characters appearing in that issue
  };

  [checkIssue, main] = await modeAppearanceAndUrl([...devolumedAppearanceArray])

  async function scrapeDirectConnection(indexDC) { //Gets the characters details and appearances
    if (database.find(o => o.url === main[indexDC])) {
      let characterNameDC = database.find(o => o.url === main[indexDC]).name;
      let appearanceArrayDC = []
      let flag = true;
      let imgUrlDC = "https://marvel.fandom.com" + main[indexDC]
      let characterUrl = main[indexDC].split("/")
      characterUrl = "https://marvel.fandom.com/wiki" + "/Category:" + characterUrl[2] + "/Appearances"
      let first, second
      while (flag) {
        [first, second] = await scraper(characterUrl)
        appearanceArrayDC.push(...first)

        if (second == "EXIT") {
          break
        } else {
          characterUrl = second
        }
      }
      return [appearanceArrayDC, imgUrlDC, characterNameDC]
    } else {
      return [null, null, null]
    }
  }

  var [appearanceArray, imgUrl, characterName] = await scrapeDirectConnection(0) //Will get the main character in the mode issue unless that character is the input character or the character is not in the database then it checks the next 2 until a valid character is found
  if (JSON.stringify(appearanceArray) === JSON.stringify(arr) || appearanceArray == null) {
    [appearanceArray, imgUrl, characterName] = await scrapeDirectConnection(1)
  }
  if (appearanceArray == null || appearanceArray.length == 1) {
    [appearanceArray, imgUrl, characterName] = await scrapeDirectConnection(2)
  }
  //console.log(characterName)

  var inputSet = new Set(arr)
  var firstConnectionSet = new Set(appearanceArray)
  var intersectionA = new Set([...inputSet].filter(x => firstConnectionSet.has(x)));
  if (appearanceArray == null || appearanceArray.length == 1) { // If the connection is a dead end then the function has to return a change value
    //console.log([appearanceArray, Array.from(intersectionA), imgUrl, characterName, "CHANGE"])
    return [appearanceArray, Array.from(intersectionA), imgUrl, characterName, "CHANGE"]
  } else {
    return [appearanceArray, Array.from(intersectionA), imgUrl, characterName, ""] // Returns the data for the direct connection
  }
}

function IdealNotableCharacter(notableConnections) {//Gets the best notable connection based on how many appearances is shares with the input character
  let best = []
  let name = ""
  for (let i = 0; i < notableConnections.length; i++) {
    let currentName = Object.keys(notableConnections[i])[0]
    let currentAppearances = Object.values(notableConnections[i])[0]

    if (currentAppearances.length >= best.length) {
      best = currentAppearances
      name = currentName
    }
  }
  let bestUrl = newnotable.find(item => item.name === name).imgUrl
  best = new Set(newnotable.find(item => item.name === name).appearances)
  //console.log(best, name,bestUrl)
  return [best, name, bestUrl]
}

app.get("/img", async (req, res) => {
  try {
    const { data } = await axios.get(req.query.nurl);
    let $ = cheerio.load(data);
    let img = $(".pi-image-thumbnail").attr("src");
    [endp1, endp2, endp3] = [img.indexOf(".png"), img.indexOf(".jpg"), img.indexOf(".jpeg")]
    if (endp1 != -1) {
      res.json(decodeURI(img.slice(0, endp1 + 4)))
    } else if (endp2 != -1) {
      res.json(decodeURI(img.slice(0, endp2 + 4)))
    } else if (endp3 != -1) {
      res.json(decodeURI(img.slice(0, endp3 + 5)))
    }
  } catch (err) {
    res.json("")
  }
})


app.get("/api", async (req, res) => {
  res.json(database)
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`)
  //setTimeout(()=>console.log(database),5000)
});
