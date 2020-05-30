# corona

Notes not formatted/organized yet.  

https://www.codeproject.com/KB/cs/sms/sms.zip  
http://www.scampers.org/steve/sms/libraries.htm  
10.0.0.53:8090  
192.168.1.102:8080/receivesms  

http://10.0.0.53:8090/sendsms?username=sadiq&password=1234&phone=8048339565&message=test  
https://192.168.102:8080/receivesms  
http://localhost:1337/sms (Local send message)  

Twilio  
ACCOUNT SID  
	<YOUR_TWILIO_ACCOUNT_SID>  
AuthToken  
	<YOUR_TWILIO_AUTH_TOKEN>  
Twilio Phone Number: <YOUR_TWILIO_PHONE_NUMBER>  
Referral Code: www.twilio.com/referral/l4zoCa  
Environment Variables:  
	TWILIO_ACCOUNT_SID=<YOUR_TWILIO_ACCOUNT_SID>  
	TWILIO_AUTH_TOKEN=<YOUR_TWILIO_AUTH_TOKEN>  
Using Twilio cli to update localhost and test in local  
	twilio phone-numbers:update "+12084875541" --sms-url="http://localhost:1337/sms"  
	https://corona-alerts.herokuapp.com/sms --> To update in Twilio Server Dashboard for the phone number
Heroku setting environment variable   
	heroku config:set key1=value1 key2=value2 (to set multiple environment variables)  
Deploy to Heroku  
heroku config  TWILIO_ACCOUNT_SID=AC4afc9a4ad304cdd41a29d6c113c65696 TWILIO_AUTH_TOKEN=cb475a819a809ccd777e06a9f87fed39  
Corona app check status  
	https://corona-alerts.herokuapp.com/hearbeat  
Nodemon debug local  
	"dev": "nodemon inspect src/app.js" -->(chrome inspect)  
