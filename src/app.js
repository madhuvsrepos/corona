const http = require('http');
const express = require('express');
const accountSid = 'AC4afc9a4ad304cdd41a29d6c113c65696';
const authToken = 'cb475a819a809ccd777e06a9f87fed39';
const client = require('twilio')(accountSid, authToken);
const port = process.env.PORT || 1337
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const app = express();

app.get('/hearbeat',(req,res) =>{
  res.send("Alive on port:"+port);
})

app.post('/sms', (req, res) => {
  console.log("message received");
  const twiml = new MessagingResponse();
  twiml.message('There is a pink mermaid - Sana');

  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});


client.messages
  .create({
     body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
     from: '+12084875541',
     to: '+15558675310'
   })
  .then(message => console.log(message.sid)); 

http.createServer(app).listen(port, () => {
  console.log('Express server listening on port:'+port);
});


