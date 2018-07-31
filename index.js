const express = require("express");
const htmlEncode = require("htmlencode").htmlEncode;

const PORT = 8001;

const app = express();

app.disable("x-powered-by");

app.get("/", (req, res) => {
  let title;
  let description;
  let image;
  let siteName;
  let color;
  if (req.query) {
    if (req.query.title) title = req.query.title;
    if (req.query.description) description = req.query.description;
    if (req.query.image) description = req.query.image;
    if (req.query.site_name) siteName = req.query.site_name;
    if (req.query.color) color = req.query.color;
  }
  if (!title && !description) {
    title = "A website allowing you to send embeds in Discord."
    description = `Just use the query parameters "title" and "description".`;
  }
  res.send(`<!DOCTYPE html><html><head>${title ? `<meta property="og:title" content="${htmlEncode(title)}">` : ""}${description ? `<meta property="og:description" content="${htmlEncode(description)}">` : ""}${image ? `<meta property="og:image" content="${htmlEncode(image)}">` : ""}${siteName ? `<meta property="og:site_name" content="${htmlEncode(siteName)}">` : ""}${color ? `<meta name="theme-color" content="#${color}">` : ""}</head><body>Made by <a href="https://github.com/Mega-Mewthree">Mega_Mewthree</a><br><a href="https://github.com/Mega-Mewthree/DiscordSafeEmbed">Source Code</a></body></html>`);
});

app.listen(PORT, () => {
  console.log(`Started listening on port ${PORT} at ${Date.now()}`);
});
