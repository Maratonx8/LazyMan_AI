const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let projectPrompts = {
  "demo-project": []
};

let projectSteps = {
  "demo-project": []
};

app.get("/", (req, res) => {
  res.json({ ok: true, service: "LazyMan API" });
});

// site-ul trimite prompt
app.post("/project/:id/prompt", (req, res) => {
  const projectId = req.params.id;
  const { prompt } = req.body || {};

  if (!projectPrompts[projectId]) {
    projectPrompts[projectId] = [];
  }

  if (!projectSteps[projectId]) {
    projectSteps[projectId] = [];
  }

  projectPrompts[projectId].push(prompt);

  // test simplu: backendul generează mereu un part
  projectSteps[projectId].push({
    type: "create_part",
    name: "LazyBlock",
    size: [20, 1, 20],
    position: [0, 5, 0],
    anchored: true
  });

  res.json({ ok: true });
});

// pluginul ia update-uri
app.get("/project/:id/updates", (req, res) => {
  const projectId = req.params.id;

  if (!projectSteps[projectId]) {
    return res.json({ ok: true, steps: [] });
  }

  const steps = projectSteps[projectId];
  projectSteps[projectId] = [];

  res.json({
    ok: true,
    steps
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("LazyMan API running");
});
