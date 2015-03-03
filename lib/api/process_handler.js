function process(config,req,res) {
  console.log("hello world");
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end("ok");
}

module.exports.process = process;