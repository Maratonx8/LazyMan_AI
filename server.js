const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())

let connections = {}

app.get("/", (req,res)=>{
    res.json({ok:true, service:"LazyMan API"})
})

app.post("/plugin/connect", (req,res)=>{
    const { code } = req.body

    connections[code] = Date.now()

    res.json({ok:true})
})

app.post("/plugin/ping", (req,res)=>{
    const { code } = req.body

    connections[code] = Date.now()

    res.json({ok:true})
})

app.get("/plugin/status", (req,res)=>{
    const code = req.query.code

    const last = connections[code]

    if(!last){
        return res.json({connected:false})
    }

    const alive = Date.now() - last < 15000

    res.json({connected: alive})
})

app.listen(3000, ()=>{
    console.log("LazyMan API running")
})
