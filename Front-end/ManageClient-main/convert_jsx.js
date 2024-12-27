#!/usr/bin/env node
var dir = require('node-dir');
const fs = require('fs');

async function run() {

  dir.readFiles(__dirname, {
    excludeDir: ['node_modules'],
    match: /.tsx$/,
    }, async function(err, content, filename, next) {
        if (err) throw err;
        console.log(filename);
        let response = await fetch('https://convert.tbg95.co/api/typescript-to-javascript', {
          method: "POST",
          body: content,
        });
        response = await response.text();
        console.log(response);
        fs.writeFile(filename, response, err => {
            if (err) {
              console.error(err);
            }
        });
        next();
    },
    function(err, files){
        if (err) throw err;
        console.log('finished reading files:');
    });


}
run();