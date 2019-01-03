var fs = require('fs');  // module for read/write on files
var express = require('express'); // module for receive http request
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var log = require('simple-node-logger').createSimpleFileLogger('./logServer.log'); // module for saving server logging
log.setLevel('debug');

var TimeTableJson = './jsonFiles/timeTable.json';
var ThermostatJson = './jsonFiles/thermostat.json';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.listen(80); // http listen on port 80
log.info('http: ip 192.168.192.85 on port 80');
app.use(express.static('public')) // set public/index.html as static

app.get('/initThermostat', function (req, res) {
    var contents = fs.readFileSync(ThermostatJson);
    var json = JSON.parse(contents);
    res.send(json);
})

app.get('/initTimeTable', function (req, res) {
    var contents = fs.readFileSync(TimeTableJson);
    var jsonTimeTable = JSON.parse(contents);
    res.send(jsonTimeTable);
})


app.get('/updateTimeTable', function (req, res) {
    console.log(req.query);
    var info = req.query;

    var url = 'http://elastic.gnet.it/timetabletermostato/_doc/' + info.mac;
    request.get(url, function (err, response, body) {
        console.log(body)
        var contents = JSON.parse(body);
        var data;
        if (contents.found != false) {
            data = contents._source; // { timetable: [{start: {date: ""}, end: {date: ""}}, {..}, ...], mac: ""}
        }
        else {
            data = {
                timetable: [],
                mac: info.mac
            }
        }
        data.timetable.push({
            start: {
                hour: info.sh,
                minute: info.sm
            },
            end: {
                hour: info.eh,
                minute: info.em
            }
        })
        var dataSend = {
            url: url,
            body: data,
            json: true
        }
        console.log(JSON.stringify(dataSend))
        request.post(dataSend, function (err, response, body) {
            console.log(body)
        })

    var contents = fs.readFileSync(TimeTableJson);
    var json = JSON.parse(contents);
    for (i in json) {
        console.log(i)
        console.log(json[i])
        console.log(info[i])
        if (info[i] == 'true') {
            json[i].push({
                "mac": info.mac,
                "start": {
                    "h": info.sh,
                    "m": info.sm
                },
                "end": {
                    "h": info.eh,
                    "m": info.em
                }
            })
        }
    }
    console.log(JSON.stringify(json))
    fs.writeFileSync(TimeTableJson, JSON.stringify(json));
    res.send("OK");
    })
})

app.get('/getTemp', function (req, res) {
    var url = 'http://elastic.gnet.it/logtemperature/_search';
    request.get(url, function (err, response, body) {
        var contents = fs.readFileSync(ThermostatJson);
        var json = JSON.parse(contents);
        console.log(body)
        var parsed = JSON.parse(body);
        var data = parsed.hits.hits;
        var jsonResponse = [];
        for (i in data) {
            jsonResponse.push({
                "id": json[data[i]._id],
                "temp": data[i]._source.data.temperature
            })
        }
        res.send(jsonResponse);
    })
    
})

app.get('/getConfig', function (req, res) {
    sw = req.query.sw;
    var url = 'http://elastic.gnet.it/configtermostato/_doc/' + sw;
    request.get(url, function (err, response, body) {
        var config = JSON.parse(response.body);
        console.log(config._source);
        res.send(config._source);
    })
})

app.get('/setRelay', function (req, res) {
    var config = {
        data: {
            temperature: req.query.t,
            switch: req.query.checked
        },
        date: new Date().getTime()
    }
    id = req.query.sw;
    console.log(req.query);
    var dataSend = {
        url: 'http://elastic.gnet.it/configtermostato/_doc/' + id,
        body: config,
        json: true
    }

    request.post(dataSend, function (err, response, body) {
        if (err) throw err;
        console.log(body);
    });
    res.send("OK");
})

app.get('/newThermostat', function (req, res) {
    var name = req.query.name;
    console.log(name)
    var contents = fs.readFileSync(ThermostatJson);
    var json = JSON.parse(contents);
    var url = 'http://elastic.gnet.it/logtemperature/_search';
    var macAddress = "";
    console.log('sending request to Elastic')
    request.get(url, function (err, response, body) {
        console.log('Risposta di Elastic: '+ body)
        var parsed = JSON.parse(body);
        data = parsed.hits.hits;
        var macAddressFlag = false;
        console.log('DATI RICEVUTI: ' + JSON.stringify(data));
        for (i in data) {
            console.log('i = ' + i)
            console.log('data[i]._id = ' + data[i]._id)
            console.log(json[data[i]._id])
            if (json[data[i]._id] == undefined) {
                macAddressFlag = true;
                macAddress = data[i]._id;
                json[macAddress] = name;
                console.log(json[macAddress])
                fs.writeFileSync(ThermostatJson, JSON.stringify(json));
                res.send('OK');
            } 
        }
        if (macAddressFlag == false) {
            res.send("ERROR");
        }
    })
})
    

app.get('/deleteThermostat', function (req, res) {
    var id = req.query.sw;
    var contents = fs.readFileSync(ThermostatJson);
    var json = JSON.parse(contents);
    var newString = {};
    var index = 0;
    for (i in json){
        if (i != id){
            newString[i] = json[i];
            index++;
        }
    }
    console.log(JSON.stringify(newString));
    fs.writeFileSync(ThermostatJson, JSON.stringify(newString));
    request.delete('http://elastic.gnet.it/logtemperature/_doc/' + id, function (err, response, body) {
        if (err) throw err;
        console.log(body);
        res.send('OK');
    })
})