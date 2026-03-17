const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let activeCodes = {};

app.get("/", (req, res) => {
    res.json({ ok: true, service: "LazyMan API" });
});

// GENERATE CODE (SITE)
app.post("/plugin/connect-code", (req, res) => {

    const code = "LM-" + Math.floor(10000 + Math.random() * 90000);

    activeCodes[code] = {
        connected: false
    };

    res.json({
        ok: true,
        code
    });

});

// CONNECT (PLUGIN)
app.post("/plugin/connect", (req, res) => {

    const { code } = req.body;

    if (!activeCodes[code]) {
        return res.json({
            ok: false,
            error: "Invalid code"
        });
    }

    activeCodes[code].connected = true;

    res.json({
        ok: true,
        token: Math.random().toString(36)
    });

});

// STATUS (SITE POLLING)
app.get("/plugin/status", (req, res) => {

    const code = req.query.code;

    if (!activeCodes[code]) {
        return res.json({
            connected: false
        });
    }

    res.json({
        connected: activeCodes[code].connected
    });

});

app.listen(3000, () => {
    console.log("LazyMan API running");
});
