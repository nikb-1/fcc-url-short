var express = require('express');
var validator = require('validator');
var mongodb = require('mongodb').MongoClient;

var app = express();
app.use(express.static(__dirname + '/public'));

app.get('/new/:url*', function (req, res) {
	res.setHeader('Content-Type', 'application/json');
	var origUrl = req.params.url+req.params[0]; // work around as not normal behaviour to pass url string as parameter
    var shortUrl = 0;
    var errorJSON = {"error":"URL was incorrectly formatted, please check to ensure you have typed a valid url"};
    if (!validator.isURL(origUrl)){
    	res.end(JSON.stringify(errorJSON));
    	return;
    }

    var urlDB = process.env.MONGOLAB_URI;
	mongodb.connect(urlDB, function (err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:'+err);
			return;
		}
		else {
			var collection = db.collection("url_short");
			var idCount = 0;

			collection.find({_id:0}).toArray(function(err, docs) {
			    if (err){
			    	console.log("Collection.find ERROR: "+err);
			    	return;
			    }

		    	if (docs.length == 0){
		    		collection.insertOne({ _id:0, counter:1},function(err){
		    			idCount = 1;
			    		shortUrl = idCount;
			    		collection.findOneAndUpdate(
				    		{_id:0},
				    		{ $inc: {counter:1}},
				    		function (err,r){
				    			collection.insertOne({ _id:idCount, original_url: origUrl}, function (err){
				    				db.close();
				    				jsonRes = {"original_url":origUrl,"short_url": ("https://url-short-nburazor.herokuapp.com/"+shortUrl)};
    								res.end(JSON.stringify(jsonRes));
				    			});
				    		}
				    	);
		    		});
		    	}
		    	else if (docs.length > 1){
		    		console.error("ERR: Duplicate 'counter' document, check DB");
		    		return;
		    	}
		    	else {
		    		idCount=docs[0].counter;
		    		shortUrl=idCount;
			    	collection.findOneAndUpdate(
			    		{_id:0},
			    		{ $inc: {counter:1}},
			    		function (err,r){
			    			collection.insertOne({ _id:idCount, original_url: origUrl}, function (err){
			    				db.close();
			    				jsonRes = {"original_url":origUrl,"short_url": ("https://url-short-nburazor.herokuapp.com/"+shortUrl)};
								res.end(JSON.stringify(jsonRes));
			    			});
			    		}
			    	);
		    	}
		    });
		}
	});
});

app.get('/:id',function(req,res){
	var getId = Number(req.params.id);
	var errorJSON = {"error":"The specified url id is incorrectly formatted, please check it is entered correctly"};
    if (!getId){
    	res.end(JSON.stringify(errorJSON));
    	return;
    }

	var urlDB = process.env.MONGOLAB_URI;
	mongodb.connect(urlDB, function (err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:'+err);
			return;
		}
		else {
			var collection = db.collection("url_short");

			collection.find({_id:getId}).toArray(function(err, docs) {
			    if (err){
			    	console.log("Collection.find ERROR: "+err);
			    	db.close();
			    	return;
			    }

		    	if (docs.length == 0){
		    		errorJSON['error']="The specified url id does not exist";
		    		res.end(JSON.stringify(errorJSON));
		    		db.close();
    				return;
		    	}
		    	else if (docs.length > 1){
		    		console.error("ERR: Duplicate 'counter' document, check DB");
		    		errorJSON['error']="Duplicate id for short url";
		    		res.end(JSON.stringify(errorJSON));
		    		db.close();
		    		return;
		    	}
		    	else {
		    		var redirectURL = docs[0].original_url;
		    		res.redirect(redirectURL);
			    	db.close();
			    	return;
		    	}
		    });
		}
	});
});

app.get('/',function(req,res){
	res.sendFile('index.html');
});

app.listen(process.env.PORT || 8080, function () {
	console.log('URL Shortener Microservice listening on port '+process.env.PORT||8080+'!');
});

