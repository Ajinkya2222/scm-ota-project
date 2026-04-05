const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());

// -------- GET VERSION --------
app.get("/version", (req, res) => {
  const data = JSON.parse(fs.readFileSync("versions.json"));
  res.json(data);
});

// -------- DOWNLOAD FIRMWARE --------
app.get("/firmware/:file", (req, res) => {
  const filePath = path.join(__dirname, "firmware", req.params.file);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  const stat = fs.statSync(filePath);

  res.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-Length": stat.size,
    "Connection": "close"
  });

  fs.createReadStream(filePath).pipe(res);
});

// -------- UPDATE VERSION --------
app.post("/update", (req, res) => {
  const { version, file, changes } = req.body;
  const host = req.headers.host;

  const newData = {
    latest_version: version,
    firmware_url: `http://${host}/firmware/${file}`
  };

  fs.writeFileSync("versions.json", JSON.stringify(newData, null, 2));

  let history = [];
  if (fs.existsSync("history.json")) {
    history = JSON.parse(fs.readFileSync("history.json"));
  }

  history.push({
    version,
    date: new Date().toISOString(),
    changes
  });

  fs.writeFileSync("history.json", JSON.stringify(history, null, 2));

  res.json({ message: "Updated + history saved" });
});

// -------- ROLLBACK --------
app.post("/rollback", (req, res) => {
  const { version } = req.body;
  const host = req.headers.host;

  const newData = {
    latest_version: version,
    firmware_url: `http://${host}/firmware/firmware_${version}.bin`
  };

  fs.writeFileSync("versions.json", JSON.stringify(newData, null, 2));

  res.json({ message: "Rollback done" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
