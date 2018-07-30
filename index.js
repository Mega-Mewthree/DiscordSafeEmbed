const express = require("express");
const htmlEncode = require("htmlencode").htmlEncode;

const PORT = 8080;

const app = express();

app.disable("x-powered-by");

app.get("/", (req, res) => {
  let title;
  let description;
  if (req.query) {
    if (req.query.title) title = req.query.title;
    if (req.query.description) description = req.query.description;
  }
  if (!title && !description) {
    title = "A website allowing you to send embeds in Discord."
    description = "Just use the query parameters `title` and `description`.";
  }
  res.send(`<!DOCTYPE html><html><head>${title ? `<meta property="og:title" content="${htmlEncode(title)}">` : ""}${description ? `<meta property="og:description" content="${htmlEncode(description)}">` : ""}</head><body></body></html>`);
});

app.listen(PORT, () => {
  console.log(`Started listening on port ${PORT} at ${Date.now()}`);
});
