var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var methodOverride = require('method-override');

var app = express();


app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'))
app.use(bodyParser.urlencoded({'extended': 'true'}))
app.use(bodyParser.json());
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(methodOverride());

require('./app/routes.js')(app);

var server = app.listen(7443, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Hic sunt dracones: http://%s:%s', host, port);
});
