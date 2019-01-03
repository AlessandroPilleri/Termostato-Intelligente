var fs = require('fs');  // module for read/write on files
var axios = require('axios'); // module for send http request
var express = require('express'); // module for receive http request
var app = express();
var log = require('simple-node-logger').createSimpleFileLogger('./logServer.log'); // module for saving server logging
log.setLevel('debug');

var flagThreadsIngresso = false;
var flagThreadsSecondo = false;
var flagThreadsMarketing = false;

var fileTimeTable = './timeTable.json'; // json file with time table info

app.listen(8080); // http listen on port 8080
log.info('http: ip 192.168.192.4 on port 8080');
app.use(express.static('public')) // set public/index.html as static

function shutdown (url) {
    axios.post(url + '/setRelay?sw=shutdown');
}

function dataHandler (data) { // manage received data
    log.debug('Data received: ' + data); // data[0] = checked // data[1] = temperature // data[2] = 0/1/2 (ingresso/secondo/Marketing)
    log.info('Triggering the relay...');
    log.debug('flag ingresso prima: ' + flagThreadsIngresso);
    log.debug('flag secondo prima: ' + flagThreadsSecondo);
    log.debug('flag Marketing prima: ' + flagThreadsMarketing);
    
    var temp = data[1];
    if (data[0] == 'true') {
        if (data[2] == 0) {
            if (flagThreadsIngresso) {
                log.debug('regenerated interval');
                clearInterval(manageIngresso);
                flagThreadsIngresso = false;
            }
            url = 'http://192.168.192.50:8080';
            manageIngresso = setInterval(function () {
                axios.get(url + '/getTemperatura')
                    .then(function (response) {
                        if (response.data > temp) {
                            switchRelay = 1;
                        }
                        else {
                            switchRelay = 0;
                        }
                        axios.post(url + '/setRelay?sw=' + switchRelay);
                    })
                    .catch(function (response) {
                        console.error(response);
                    })
            }, 10000, temp, url);
            flagThreadsIngresso = true;
        }
        if (data[2] == 1) {
            if (flagThreadsSecondo) {
                log.debug('regenerated interval');
                clearInterval(manageSecondo);
                flagThreadsSecondo = false;
            }
            url = 'http://192.168.192.56:8080';
            manageSecondo = setInterval(function () {
                axios.get(url + '/getTemperatura')
                    .then(function (response) {
                        if (response.data > temp) {
                            switchRelay = 1;
                        }
                        else {
                            switchRelay = 0;
                        }
                        axios.post(url + '/setRelay?sw=' + switchRelay);
                    })
                    .catch(function (response) {
                        console.error(response);
                    })
            },10000, temp, url);
            flagThreadsSecondo = true;
        }
        if (data[2] == 2) {
            if (flagThreadsMarketing) {
                log.debug('regenerated interval');
                clearInterval(manageMarketing);
                flagThreadsMarketing = false
            }
            url = 'http://192.168.192.53:8080';
            manageMarketing = setInterval(function () {
                axios.get(url + '/getTemperatura')
                    .then(function (response) {
                        if (response.data < temp) {
                            switchRelay = 1;
                        }
                        else {
                            switchRelay = 0;
                        }
                        axios.post(url + '/setRelay?sw=' + switchRelay);
                    })
                    .catch(function (response) {
                        console.error(response);
                    })
            },10000, temp, url);
            flagThreadsMarketing = true;
        }
    log.debug('url: ' + url);
    }
    if (data[0] == 'false') {
        if (data[2] == 0) {
            log.debug('clear interval');
            clearInterval(manageIngresso);
            shutdown('http://192.168.192.50:8080');
            flagThreadsIngresso = false;
        }
        if (data[2] == 1) {
            log.debug('clear interval');
            clearInterval(manageSecondo);
            shutdown('http://192.168.192.56:8080')
            flagThreadsSecondo = false;
        }
        if (data[2] == 2) {
            log.debug('clear interval');
            clearInterval(manageMarketing);
            shutdown('http://192.168.192.53:8080')
            flagThreadsMarketing = false;
        }
    }
    log.debug('flag ingresso dopo: ' + flagThreadsIngresso);
    log.debug('flag secondo dopo: ' + flagThreadsSecondo);
    log.debug('flag Marketing dopo: ' + flagThreadsMarketing);
}

app.post('/checkbox', function (req, res) { // receive data from html and send data to dataHandler
    var data = [req.param('checked'), req.param('t'), req.param('sw')];
    dataHandler(data);
})

app.get('/getTemperatura', function (req, res) { // receive temperature request, ask temperature to every raspberry pi and give back to html
    temps = [];
    axios.get('http://192.168.192.50:8080/getTemperatura')
        .then(function (response) {
            log.debug('dati ricevuti dal sensore ' + response.data);
            temps[0] = response.data;
        })
        .catch(function (response) {
            log.debug('dati catturati ' + response);
        })
    axios.get('http://192.168.192.56:8080/getTemperatura')
        .then(function (response) {
            log.debug('dati ricevuti dal sensore ' + response.data);
            temps[1] = response.data;
        })
        .catch(function (response) {
            log.debug('dati catturati ' + response);
        })
    axios.get('http://192.168.192.58:80/getTemperatura')
        .then(function (response) {
            log.debug('dati ricevuti dal sensore ' + response.data);
            temps[2] = response.data;
        })
        .catch(function (response) {
            log.debug('dati catturati ' + response);
        })
    
    setTimeout(function () {
        log.debug('sending ' + temps)
        res.send(temps);
    }, 3000);
})

app.post('/updateTimeTable', function (req,res) { // receive request to update timetable
    var mon = req.param('mon'); console.log(mon);
    var tue = req.param('tue'); console.log(tue);
    var wed = req.param('wed'); console.log(wed);
    var thu = req.param('thu'); console.log(thu);
    var fri = req.param('fri'); console.log(fri);
    var sat = req.param('sat'); console.log(sat);
    var sun = req.param('sun'); console.log(sun);
    var oreI = req.param('oreI'); console.log(oreI);
    var minutiI = req.param('minutiI'); console.log(minutiI);
    var oreF = req.param('oreF'); console.log(oreF);
    var minutiF = req.param('minutiF'); console.log(minutiF);
    var sw = req.param('sw'); console.log(sw);
    var contents = fs.readFileSync(fileTimeTable);
    //console.log(contents)
    var jsonTimeTable = JSON.parse(contents);

    var info = {
        "sw": sw,
        "inizio": {
            "ore": oreI,
            "minuti": minutiI
        },
        "fine": {
            "ore": oreF,
            "minuti": minutiF
        }
    }

    if (mon == 'true') {
        console.log('mon is true');
        jsonTimeTable.mon.push(info);
        axios.post('/updateTimeTable?info=' + JSON.stringify(info) + '&day=mon');
    }
    if (tue == 'true') {
        console.log('tue is true');
        jsonTimeTable.tue.push(info);
        axios.post('/updateTimeTable?info=' + JSON.stringify(info) + '&day=tue')
    }
    if (wed == 'true') {
        console.log('wed is true');
        jsonTimeTable.wed.push(info);
        axios.post('/updateTimeTable?info=' + JSON.stringify(info) + '&day=wed')
    }
    if (thu == 'true') {
        console.log('thu is true');
        jsonTimeTable.thu.push(info);
        axios.post('/updateTimeTable?info=' + JSON.stringify(info) + '&day=thu')
    }
    if (fri == 'true') {
        console.log('fri is true');
        jsonTimeTable.fri.push(info);
        axios.post('/updateTimeTable?info=' + JSON.stringify(info) + '&day=fri')
    }
    if (sat == 'true') {
        console.log('sat is true');
        jsonTimeTable.sat.push(info);
        axios.post('/updateTimeTable?info=' + JSON.stringify(info) + '&day=sat')
    }
    if (sun == 'true') {
        console.log('sun is true');
        jsonTimeTable.sun.push(info);
        axios.post('/updateTimeTable?info=' + JSON.stringify(info) + '&day=sun')
    }
    var rewrite = JSON.stringify(jsonTimeTable)
    console.log(rewrite);
    fs.writeFileSync(fileTimeTable, rewrite); // update time table json
    res.send(rewrite);
})

app.get('/initTimeTable', function (req, res) {
    var contents = fs.readFileSync(fileTimeTable);
    //console.log(contents)
    var jsonTimeTable = JSON.parse(contents);
    res.send(jsonTimeTable);
})

app.post('/getGiorno', function (req, res) {
    var id = req.param('id');
    var contents = fs.readFileSync(fileTimeTable);
    //console.log(contents)
    var jsonTimeTable = JSON.parse(contents);
    Object.keys(jsonTimeTable).forEach(function (key) {
        if (key == id) {
            res.send(jsonTimeTable[key]);
        }
    })
})

process.on('SIGINT', function () { // close on Ctrl+C
    //axios.post('/elasticsearch?')
    process.exit();
});

