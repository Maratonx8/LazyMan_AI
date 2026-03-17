const express = require("express")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())

// ===== MEMORY DATABASE =====
let activeCodes = {}
let connections = {}

// TEST
app.get("/", (req, res) => {
    res.json({ ok: true, service: "LazyMan API" })
})

// GENERATE CONNECT CODE
app.post("/plugin/connect-code", (req, res) => {
    const code = "LM-" + Math.floor(Math.random() * 99999)

    activeCodes[code] = {
        connected: false,
        projectId: null
    }

    res.json({ ok: true, code })
})

// PLUGIN CONNECT HANDSHAKE
app.post("/plugin/connect", (req, res) => {
    const { code } = req.body

    if (!activeCodes[code]) {
        return res.json({ ok: false, error: "Invalid code" })
    }

    activeCodes[code].connected = true

    connections["demo-project"] = true

    res.json({ ok: true, connected: true })
})

// STATUS CHECK (FOARTE IMPORTANT)
app.get("/plugin/status", (req, res) => {
    const projectId = req.query.projectId

    if (connections[projectId]) {
        return res.json({ ok: true, connected: true })
    }

    res.json({ ok: true, connected: false })
})

app.listen(3000, () => {
    console.log("LazyMan API running")
})
