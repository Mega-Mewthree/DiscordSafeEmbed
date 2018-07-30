const express = require("express");
const htmlEncode = require("htmlencode").htmlEncode;

const app = express();

app.disable("x-powered-by");
app.use(express.urlencoded({limit: "10kb", extended: true}));

app.get("/", (req, res) => {
  let title;
  let description;
  if (req.params) {
    if (req.params.title) title = req.params.title;
    if (req.params.description) description = req.params.description;
  }
  if (!title && !description) {
    title = "A website allowing you to send embeds in Discord."
    description = "Just use the query parameters `title` and `description`.";
  }
  res.send(`<!DOCTYPE html><html><head>${title ? `<meta property="og:title" content="${htmlEncode(title)}">` : ""}${description ? `<meta property="og:description" content="${htmlEncode(description)}">` : ""}</head><body></body></html>`);
});

app.listen(8080);
