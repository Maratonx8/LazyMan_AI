const express = require("express")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())

let connections = {}

app.get("/", (req,res)=>{
    res.json({ok:true})
})

app.post("/plugin/connect-code", (req,res)=>{
    const code = "LM-" + Math.floor(Math.random()*90000+10000)

    connections[code] = {
        connected:false,
        lastPing:0
    }

    res.json({ok:true, code})
})

app.post("/plugin/connect", (req,res)=>{
    const { code } = req.body

    if(!connections[code]){
        return res.json({ok:false})
    }

    connections[code].connected = true
    connections[code].lastPing = Date.now()

    res.json({ok:true})
})

app.post("/plugin/ping", (req,res)=>{
    const { code } = req.body

    if(connections[code]){
        connections[code].lastPing = Date.now()
    }

    res.json({ok:true})
})

app.get("/plugin/status", (req,res)=>{
    const code = req.query.code

    const c = connections[code]

    if(!c){
        return res.json({connected:false})
    }

    const alive = Date.now() - c.lastPing < 300000

    res.json({connected: alive})
})

app.listen(3000, ()=>{
    console.log("LazyMan API RUNNING")
})
