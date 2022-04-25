"use strict";

const { Transform } = require('stream');

const csvToArray = require("./csv-to-array");


function arrayToObject(arr)
{
    return {
        file: arr[0],
        no: arr[0].substr(3,3),
        start_ts: arr[1],
        end_ts: arr[2]
    }
}


module.exports = new Transform({
    transform(chunk, encoding, callback) {
        for(const line of csvToArray(chunk.toString()))
            this.push(arrayToObject(line));

        callback()
    }
});
