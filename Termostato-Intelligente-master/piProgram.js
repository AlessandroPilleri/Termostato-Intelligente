var express = require('express');
var app = express();
var Gpio = require('onoff').Gpio;
var rpiDhtSensor = require('rpi-dht-sensor');
//var exec = require('child_process').exec;

var dht = new rpiDhtSensor.DHT11(2)
// = new Gpio(22, 'out');
/*var script = exec('sh scripts/relayPullDown.sh', function (err) {
	if (err) throw err;
});
*/
app.listen(8080);

app.get('/getTemperatura', function (req, res) {
	console.log('richiesta temperatura');
	var readout = dht.read();
	while(readout.temperature.toFixed(2) == 0.00) {
		readout = dht.read();
	}
	console.log('temperatura misurata! invio ' + readout.temperature.toFixed(2));
	res.send(readout.temperature.toFixed(2));
})

app.post('/setRelay', function (req, res) {
	console.log(req.param('sw'));
	var sw = req.param('sw');
	if (sw == 'shutdown') {
		console.log('shutted down');
		var relay = new Gpio(22, 'in');
	}
	else {
		var sw = Number(req.param('sw'));
		if (sw == 1) {
			var relay = new Gpio(22, 'out');
		}
		if (sw == 0) {
			var relay = new Gpio(22, 'in');
		}
	}
})

//app.post('/updateTimeTable'

