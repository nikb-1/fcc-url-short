var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));
app.get('/api/whoami', function (req, res) {

	var ip = req.headers['x-forwarded-for'];
	var lang = req.headers['accept-language'].split(',')[0];
	var software = req.headers['user-agent'].split('(')[1].split(')')[0];
	//console.log(req.headers);
	jsonRes = {"ipaddress":ip,"language":lang,"software":software};
	res.end(JSON.stringify(jsonRes));	
});
app.get('/',function(req,res){
	res.sendFile('index.html');
});
app.listen(process.env.PORT || 8080, function () {
  console.log('Request Header Parser Microservice listening on port '+process.env.PORT||8080+'!');
});

