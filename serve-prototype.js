const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
    fs.readFile('/home/user/webapp/tuner-prototype.html', (err, data) => {
        if (err) {
            res.writeHead(500);
            return res.end('Error');
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
    });
}).listen(8080, '0.0.0.0');
