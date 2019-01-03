var request = require('request');

var sendData = {
    url: 'http://elastic.gnet.it/timetabletermostato/_search',
    body: {
        "query": {
            "terms": {
                "_id": ["60_01_94_02_2A_B8"]
            }
        }
    },
    json: true
}

request.get(sendData, function (err, response, body) {
    console.log(response);
    console.log(body)
})