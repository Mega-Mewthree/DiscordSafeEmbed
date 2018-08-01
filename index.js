/*
Copyright (C) 2018 Mega_Mewthree

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

"use strict";

const express = require("express");
const RateLimit = require('express-rate-limit');
const htmlEncode = require("htmlencode").htmlEncode;

const PORT = 8001;
const LINK_EXPIRE = 300; // Seconds
const EXPIRED_LINK_DELETE_INTERVAL = 60; // Seconds
const LINK_CREATE_RATE_LIMIT_INTERVAL = 60; // Seconds
const LINK_CREATE_RATE_LIMIT_ALLOWANCE = 10;
const GC_INTERVAL = 600; // Seconds, only if --expose-gc is used

const app = express();

app.disable("x-powered-by");
app.enable("trust proxy"); // If running behind a reverse proxy, else comment out
app.use(express.json({
  limit: "5kb"
}));

const apiRateLimit = new RateLimit({
  windowMs: LINK_CREATE_RATE_LIMIT_INTERVAL * 1000,
  max: LINK_CREATE_RATE_LIMIT_ALLOWANCE,
  delayMs: 0,
  headers: true
});
app.use("/api/", apiRateLimit);

const links = {};

function deleteExpiredLinks() {
  const keys = Object.keys(links);
  const now = Date.now();
  // Most efficient JS loop
  let len = keys.length;
  while (len--) {
    if (now > links[len].expire) {
      delete links[len];
    }
  }
}
setInterval(deleteExpiredLinks, EXPIRED_LINK_DELETE_INTERVAL * 1000);

function garbageCollect() {
  global.gc(true);
}
if (global.gc) {
  setInterval(garbageCollect, GC_INTERVAL * 1000);
}

function generateEmbedHTML(embed) {
  return `<!DOCTYPE html><html><head>${embed.title ? `<meta property="og:title" content="${htmlEncode(embed.title)}">` : ""}${embed.description ? `<meta property="og:description" content="${htmlEncode(embed.description)}">` : ""}${embed.image ? `<meta property="og:image" content="${htmlEncode(embed.image)}">` : ""}${embed.siteName ? `<meta property="og:site_name" content="${htmlEncode(embed.siteName)}">` : ""}${embed.color ? `<meta name="theme-color" content="#${embed.color}">` : ""}</head><body><script>location="/"</script></body></html>`;
}

// https://lowrey.me/encoding-decoding-base-62-in-es6-javascript/
const base62 = {
  charset: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  encode: integer => {
    if (integer === 0) {
      return 0;
    }
    let s = [];
    while (integer > 0) {
      s = [base62.charset[integer % 62], ...s];
      integer = Math.floor(integer / 62);
    }
    return s.join("");
  }
};

function* loopingCounter(min, max) {
  let count = min;
  while (true) {
    if (++count > max) count = min;
    yield count;
  }
}

const linkCounter = loopingCounter(62 ** 3, 62 ** 4 - 1);

function generateLink() {
  return base62.encode(Date.now()) + base62.encode(((Math.random() * 238327) | 0)).padStart(3, "0") + base62.encode(linkCounter.next().value);
}

app.use(express.static("static"));

app.get("/manual", (req, res) => {
  let title;
  let description;
  let image;
  let siteName;
  let color;
  if (req.query) {
    if (req.query.title) title = req.query.title;
    if (req.query.description) description = req.query.description;
    if (req.query.image) image = req.query.image;
    if (req.query.siteName) siteName = req.query.siteName;
    if (req.query.color) color = req.query.color;
  }
  if (title && title.length > 256) return res.status(400).send("Bad Request");
  if (siteName && siteName.length > 256) return res.status(400).send("Bad Request");
  if (description && description.length > 2048) return res.status(400).send("Bad Request");
  if (color && color.length !== 6 || isNaN(parseInt(color, 16))) return res.status(400).send("Bad Request");
  if (!title && !description) {
    title = "A website allowing you to send embeds in Discord."
    description = `Just use the query parameters "title" and "description".`;
  }
  res.send(generateEmbedHTML({
    title,
    description,
    image,
    siteName,
    color
  }));
});

app.get("/e/:id", (req, res) => {
  if (!links[req.params.id]) return res.status(404).send("Not Found");
  res.send(generateEmbedHTML(links[req.params.id]));
});

app.post("/api/v1/createEmbed", (req, res) => {
  if (typeof req.body !== "object") return;
  const link = generateLink();
  const embed = links[link] = {};
  if (req.body.title) embed.title = req.body.title;
  if (req.body.description) embed.description = req.body.description;
  if (req.body.image) embed.image = req.body.image;
  if (req.body.siteName) embed.siteName = req.body.siteName;
  if (req.body.color) embed.color = req.body.color;
  if (embed.title && embed.title.length > 256) return res.status(400).send("Bad Request");
  if (embed.siteName && embed.siteName.length > 256) return res.status(400).send("Bad Request");
  if (embed.description && embed.description.length > 2048) return res.status(400).send("Bad Request");
  if (embed.color && embed.color.length !== 6 || isNaN(parseInt(embed.color, 16))) return res.status(400).send("Bad Request");
  embed.expire = Date.now() + LINK_EXPIRE * 1000;
  res.send(link);
});

app.listen(PORT, () => {
  console.log(`Started listening on port ${PORT} at ${Date.now()}`);
});
