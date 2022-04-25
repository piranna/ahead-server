#!/usr/bin/env node

const {readFileSync} = require('fs')
const {resolve} = require("path");
const { Writable } = require('stream');

const cors = require("cors");
const express = require("express");
const morgan = require("morgan");

const ChunkDB = require("./lib/chunk-db");
const ffmpegCsv = require("./lib/ffmpeg-csv");


const mainPlaylist = readFileSync("resources/mainPlaylist.m3u8", "utf8");


const index = [];
const conf = {
    chunk_length: 1,
    index_length: 10
};
let targetDuration

function chunkDuration({end_ts, start_ts})
{
    return end_ts - start_ts
}

function genExtInf({end_ts, no, start_ts})
{
    no = "00" + ( (+no.replace(/^0/, "") + 3) % 1000);
    no = no.substring(no.length - 3);

    const filename = `out${no}.ts`

    return `#EXTINF: ${end_ts - start_ts}\n${filename}`;
}

function sumDuration(acum, chunk)
{
    return acum + chunkDuration(chunk)
}


const chunks = new ChunkDB(resolve(process.cwd(), "work"));
const chunkStream = ffmpegCsv(process.stdin);

const updateStream = chunkStream.pipe(new Writable({
    write(chunk, encoding, callback) {
        console.error("chunk", chunk.no);

        index.push(chunk);

        targetDuration = Math.ceil(Math.max(...index.map(chunkDuration)));

        if (index.length > conf.index_length
            /*
            https://tools.ietf.org/id/draft-pantos-http-live-streaming-23.txt

            6.2.2.  Live Playlists

            The server MUST NOT remove a Media Segment from a Playlist file
            without an EXT-X-ENDLIST tag if that would produce a Playlist whose
            duration is less than three times the target duration.  Doing so can
            trigger playback stalls.
            */
            && index.reduce(sumDuration, 0) >= 3 * targetDuration
        ) {
            const {no} = index.shift();

            chunks.drop(no);
        }

        chunks.set(chunk.no, chunk.file);

        callback();
    }
}))


express()
    .use(cors())
    .use(morgan("tiny"))
    .get("/index-up", (_req, res) => updateStream.pipe(res))
    .get("/index.m3u8", function(_req, res){
        return res
        .set({"content-type": "application/x-mpegURL"})
        .send(mainPlaylist)
    })
    .get("/360p.m3u8", function(_req, res)
    {
        const playlist = [
            '#EXTM3U',
            `#EXT-X-TARGETDURATION:${targetDuration}`,
            '#EXT-X-VERSION:3',
            `#EXT-X-MEDIA-SEQUENCE:${chunks.removed}`,
            ...index.map(genExtInf)
        ]

        return res.send(playlist.join("\n"))
    })
    .get("/out:no.ts", function(req, res){
        return chunks
        .get(req.params.no)
        .then(res.send.bind(res))
    })
    .listen(3000)
;
