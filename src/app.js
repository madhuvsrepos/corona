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
const coronaStatsEndpoint = " https://covid-19-coronavirus-statistics.p.rapidapi.com/v1/stats";
const app = express();

router.get('/hearbeat',(req,res) =>{
  res.send("Alive on port:"+port);
})

const coronaStats = (callback) => {
        var options = {
          url: coronaStatsEndpoint,
          method: 'GET', // Don't forget this line
          headers: {
              "x-rapidapi-host":"covid-19-coronavirus-statistics.p.rapidapi.com",
          "x-rapidapi-key":"2462bbb09bmsh1d0b5f984335e39p1c2a69jsnd38ca977f87f"
          }
      };
  const dataForUser = [];
// Create request to get data
request(options, (err, response, body) => {
    if (err) {
       console.log(err);
    } else {
      
      var globalData = JSON.parse(body).data.covid19Stats;
      var countries = [... new Set(globalData.map(x => x.country))];
      countries.filter(c => { dataForUser.push({'country':c,
        'confirmedCases':globalData.filter(d => d.country==c).reduce(function(a,b){  if(typeof a !== 'undefined' && typeof b !== 'undefined' ){return a+b.confirmed}},0), 
        'deaths':globalData.filter(d => d.country==c).reduce(function(a,b){  if(typeof a !== 'undefined' && typeof b !== 'undefined' ){return a+b.deaths}},0)  
      } )});
      callback(dataForUser);
    }
});
}

router.post('/sms', (req, res) => {
  console.log('starting');
  //console.log(req.body);
  //debugger;
  if (req.body.Body.toLowerCase() == 'corona' || req.body.Body.toLowerCase() == 'usa' || req.body.Body.toLowerCase() == 'us' || req.body.Body.toLowerCase() == 'America' || req.body.Body.toLowerCase() == 'unitedstates' || req.body.Body.toLowerCase() == 'united states'){
    coronaStats((dataForUser) => {
      console.log('result fetched');
         const twiml = new MessagingResponse();
         var data = dataForUser.filter(c => c.country.toLowerCase() == 'us').map(d => 'Country:'+ d.country + ' Cases:'+d.confirmedCases+' Deaths:'+d.deaths)
         data =data + ". For other countries reply back with country name";
         //var data = dataForUser.map(d => d.country + ' Cases:'+d.confirmedCases+'Deaths:'+d.deaths).join(', ')
         twiml.message(data);
         res.writeHead(200, {'Content-Type': 'text/xml'});
         res.end(twiml.toString());
     });
    
    }
  else{
    coronaStats((dataForUser) => {
      console.log('result fetched');
         const twiml = new MessagingResponse();
         var userProvidedCountry = req.body.Body.toLowerCase();
         var data = dataForUser.filter(c => c.country.toLowerCase() == userProvidedCountry).map(d => 'Country:'+ d.country + ' Cases:'+d.confirmedCases+' Deaths:'+d.deaths)
         if(data.length <=0 ){
          //var data = dataForUser.map(d => d.country + ' Cases:'+d.confirmedCases+'Deaths:'+d.deaths).join(', ')
          twiml.message('No data found for the country:'+data);
          res.writeHead(200, {'Content-Type': 'text/xml'});
          res.end(twiml.toString());
         }
         else{
         data =data + ".For other countries reply back with country name";
         //var data = dataForUser.map(d => d.country + ' Cases:'+d.confirmedCases+'Deaths:'+d.deaths).join(', ')
         twiml.message(data);
         res.writeHead(200, {'Content-Type': 'text/xml'});
         res.end(twiml.toString());
         }
     });
    
    
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
  console.log('Express server listening on port:'+port);
});


