# threadfin-http
This is an experimental HTTP server built using Node.JS. 
threadfin-http allows you to host static HTML and REST API. It provides feature such such as HTTP response compression (deflate/gzip), Authentication and configurable document root to meet your basic need as a web server.   

Subsequently, I have also added features such as reverse proxy and prometheus integration.

# Installation
Run npm install threadfin-http to download the latest package.</br>
Create a js file called app.js with the following lines.</br> 
&nbsp;</br>
var server = require('threadfin-http');</br>
var config = "C:/threadfin/config.json";</br>
server.start(config);</br>
&nbsp;</br>
Create config.json. Sample config.json is available in test folder.</br>
Create an error folder and place a 404.html in the folder.</br>

# Usage
Create a content folder and place your index.html in the folder. </br>
Execute "node app.js"</br>

