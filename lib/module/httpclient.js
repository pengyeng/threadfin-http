var http = require('http');

function submitHTTPRequest(targetServer,requestURL, res) {

    var callback = function(response) {
        if (response.statusCode === 200) {
            res.writeHead(200, {
                'Content-Type': response.headers['content-type']
            });
            console.log("Get Response1");
            response.pipe(res);
        } else {
            console.log("Get Response2");
            res.writeHead(response.statusCode);
            res.end();
        }
    }

    var options = {
        host: targetServer,
        path: requestURL
    };
    console.log("Check "+targetServer);

    http.request(options, callback).end();

}

module.exports.submitHTTPRequest = submitHTTPRequest;