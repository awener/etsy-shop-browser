var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var etsy = require('./etsy.js');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
	res.redirect('/index.html');
})

io.of('/etsy').on('connection', function(socket){
	socket.on('fetch', function(storeName) {
		etsy.fetch(storeName, function(err, data) {
			if(err) console.log(err);
			
			socket.emit('etsyComplete', data);
		}, function(progress) {
			socket.emit('progress', progress);
		});
	});

});




server.listen(3000, function() {
	
	console.log('Server started on port ' + server.address().port);
});