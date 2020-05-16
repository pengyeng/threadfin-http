# threadfin-http
This is an experimental HTTP server built using Node.JS. 
threadfin-http allows you to host static HTML and REST API. It provides feature such such as HTTP response compression (deflate/gzip), Authentication and configurable document root to meet your basic need as a web server.   

Subsequently, I have also added features such as reverse proxy and prometheus integration.

# Installation
Run npm install threadfin-http to download the latest package.
create a js file called app.js with the following lines. 
&nbsp;
var server = require('threadfin-http');&nbsp;
var config = "C:/threadfin/config.json";&nbsp;
server.start(config);&nbsp;
&nbsp;
create config.json. Sample config.json is available in test folder.
create an error folder and place a 404.html in the folder.

# Usage
Execute node app.js
Configuration are stored in config.json.
