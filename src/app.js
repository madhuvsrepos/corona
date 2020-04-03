const http = require('http');
const express = require('express');
var router = require('express').Router();
const accountSid = 'AC4afc9a4ad304cdd41a29d6c113c65696';
const authToken = 'cb475a819a809ccd777e06a9f87fed39';
const client = require('twilio')(accountSid, authToken);
var bodyParser = require('body-parser');
var request = require('request');

router.use(bodyParser.urlencoded({ extended: false }));

const port = process.env.PORT || 1337
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const coronaStatsEndpoint = "https://covid-19-coronavirus-statistics.p.rapidapi.com/v1/stats";
const coronaStatsEndpointNew = "https://corona.lmao.ninja/countries?sort=country";
const coordinateFromPostalCodeEndpoint = "https://api.coronainusa.com/esri/geocode?address=";
const coronaStatsFromStateCounty = "https://api.coronainusa.com/location/search?";//state=TX&county=Williamson
const app = express();

router.get('/heartbeat', (req, res) => {
  res.send("Alive on port:" + port); 
})

const coronaStatsForUSPostalCode = (postalCode, callback) => {
  //debugger;
  if (postalCode.trim().length > 5){callback("");return;}
  var options = {
    url: coordinateFromPostalCodeEndpoint + postalCode,
    method: 'GET', // Don't forget this line
  };
  const dataForUser = [];
  // Create request to get data
  request(options, (err, response, body) => {
    if (err) {
      //console.log(err);
    } else {
      if (JSON.parse(body).address.county.length < 1) {
        callback("error");
      }
      var county = JSON.parse(body).address.county.replace("County", "").replace("county", "").trim();
      if (county === "Queens") {
        county = "New York";
      }
      var state = JSON.parse(body).address.state;
      var coronaStatsEndpoint = coronaStatsFromStateCounty + "state=" + state + "&county=" + county;
      var options1 = {
        url: coronaStatsEndpoint,
        method: 'GET', // Don't forget this line
      };
      request(options1, (err, response, body) => {
        if (err) {
          callback("error");
        } else {
          try {
            if(body.includes("html") || body.length < 1) {
              callback("No Data Found.");
            }
            else{
              var parsedBody = JSON.parse(body);
            var info = "State:" + parsedBody.state + " County:" + parsedBody.county + " Active:" + parsedBody.active.count + " Recovered:" + parsedBody.recovered.count + " Dead:" + parsedBody.dead.count
            callback(info);
            }
          }
          catch{
            callback("error");
          }
        }
      })
    }
  });
}

const coronaStats = (callback) => {
  var options = {
    url: coronaStatsEndpoint,
    method: 'GET', // Don't forget this line
    headers: {
      "x-rapidapi-host": "covid-19-coronavirus-statistics.p.rapidapi.com",
      "x-rapidapi-key": "2462bbb09bmsh1d0b5f984335e39p1c2a69jsnd38ca977f87f"
    }
  };
  const dataForUser = [];
  // Create request to get data
  request(options, (err, response, body) => {
    if (err) {
      //console.log(err);
    } else {

      var globalData = JSON.parse(body).data.covid19Stats;
      var countries = [... new Set(globalData.map(x => x.country))];
      countries.filter(c => {
        dataForUser.push({
          'country': c,
          'confirmedCases': globalData.filter(d => d.country == c).reduce(function (a, b) { if (typeof a !== 'undefined' && typeof b !== 'undefined') { return a + b.confirmed } }, 0),
          'deaths': globalData.filter(d => d.country == c).reduce(function (a, b) { if (typeof a !== 'undefined' && typeof b !== 'undefined') { return a + b.deaths } }, 0)
        })
      });
      callback(dataForUser);
    }
  });
}

const coronaStatsNew = (callback) => {
  var options = {
    url: coronaStatsEndpointNew,
    method: 'GET', // Don't forget this line
  };
  const dataForUser = [];
  // Create request to get data
  request(options, (err, response, body) => {
    if (err) {
      countryData="NoData";
      callback("NoData");
    } else {

      var globalData = JSON.parse(body);
                        var countries = [... new Set(globalData.map(x => {return {country: x.country, iso2: x.countryInfo.iso2, confirmedCases: x.cases, deaths: x.deaths, recovered: x.recovered}}))];
                        callback(countries);
    }
  });
}


router.post('/sms', (req, res) => {

  
  //console.log('starting');
  //console.log(req.body);
  //debugger;
  try {
    var isPostalCode = req.body.Body.toLowerCase().trim();
    var isNumberInput = !isNaN(isPostalCode.trim()) && isPostalCode.trim().length <= 11;
    if (isNumberInput || req.body.Body.toLowerCase().trim() == 'corona' || req.body.Body.toLowerCase().trim() == 'usa' || req.body.Body.toLowerCase().trim() == 'u.s.a.' || req.body.Body.toLowerCase().trim() == 'u.s.a' || req.body.Body.toLowerCase().trim() == 'us' || req.body.Body.toLowerCase().trim() == 'america' || req.body.Body.toLowerCase().trim() == 'unitedstates' || req.body.Body.toLowerCase().trim() == 'united states' || req.body.Body.toLowerCase().trim() == 'united states of america') {
      if (isNumberInput) {
        var postalCodeFailure = "";
        if (isPostalCode.trim().length > 5) {
          postalCodeFailure = "Could not process the postalcode more than 5 digits:" + isPostalCode;
        }
        coronaStatsForUSPostalCode(isPostalCode.trim(), (countyLevelInfo) => { 
          if (countyLevelInfo === "error") {
            postalCodeFailure = "Could not process the postalcode:" + isPostalCode;
          }
          if (countyLevelInfo !== "error") {
            coronaStatsNew((dataForUser) => {
              //console.log('result fetched');
              const twiml = new MessagingResponse();
              var data = dataForUser.filter(c => c.country.toLowerCase().trim() == 'usa').map(d => 'Country:' + d.country + ' Cases:' + d.confirmedCases + ' Deaths:' + d.deaths)
              if(postalCodeFailure.length>0){
                countyLevelInfo = postalCodeFailure;
              }
              data = countyLevelInfo + ". " + data + ". Reply back with PostalCode Or Country Name.";
              //var data = dataForUser.map(d => d.country + ' Cases:'+d.confirmedCases+'Deaths:'+d.deaths).join(', ')
              twiml.message(data);
              res.writeHead(200, { 'Content-Type': 'text/xml' });
              res.end(twiml.toString());
            });
          }
        });
      } else {
        coronaStatsNew((dataForUser) => {
          //console.log('result fetched');
          const twiml = new MessagingResponse();
          var data = dataForUser.filter(c => c.country.toLowerCase().trim() == 'usa').map(d => 'Country:' + d.country + ' Cases:' + d.confirmedCases + ' Deaths:' + d.deaths)
          data = data + ".  Reply back with PostalCode(US) Or Country Name.";
          //var data = dataForUser.map(d => d.country + ' Cases:'+d.confirmedCases+'Deaths:'+d.deaths).join(', ')
          twiml.message(data);
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
        });
      }
    }
    else {
      coronaStatsNew((dataForUser) => {
        //console.log('result fetched');
        const twiml = new MessagingResponse();
        var userProvidedCountry = req.body.Body.toLowerCase().trim();
        var data = dataForUser.filter(c => c.country.toLowerCase() == userProvidedCountry.trim()).map(d => 'Country:' + d.country + ' Cases:' + d.confirmedCases + ' Deaths:' + d.deaths)
        if (data.length <= 0) {
          //var data = dataForUser.map(d => d.country + ' Cases:'+d.confirmedCases+'Deaths:'+d.deaths).join(', ')
          twiml.message('No data found for the country:' + userProvidedCountry);
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
        }
        else {
          data = data + ". Reply back with PostalCode(US) Or Country Name.";
          //var data = dataForUser.map(d => d.country + ' Cases:'+d.confirmedCases+'Deaths:'+d.deaths).join(', ')
          twiml.message(data);
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
        }
      });


    }
  }
  catch(err){
    const twiml = new MessagingResponse();
    twiml.message("Unable to Process your request.")
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});


client.messages
  .create({
    body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
    from: '+12084875541',
    to: '+15558675310'
  })
  .then(message => console.log(message.sid));

http.createServer(router).listen(port, () => {
  console.log('Express server listening on port:' + port);
});


