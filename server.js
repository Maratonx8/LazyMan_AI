const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const projectPrompts = {
  "demo-project": []
};

const projectSteps = {
  "demo-project": []
};

app.get("/", (req, res) => {
  res.json({ ok: true });
});

app.post("/project/:id/prompt", (req, res) => {
  const projectId = req.params.id;
  const { prompt } = req.body || {};

  if (!projectPrompts[projectId]) projectPrompts[projectId] = [];
  if (!projectSteps[projectId]) projectSteps[projectId] = [];

  projectPrompts[projectId].push(prompt || "");

  // test simplu: creează un bloc roșu
  projectSteps[projectId].push({
    type: "create_part",
    name: "LazyBlock",
    size: [20, 1, 20],
    position: [0, 5, 0],
    anchored: true,
    color: [255, 0, 0]
  });

  res.json({ ok: true });
});

app.get("/project/:id/updates", (req, res) => {
  const projectId = req.params.id;

  if (!projectSteps[projectId]) {
    return res.json({ ok: true, steps: [] });
  }

  const steps = [...projectSteps[projectId]];
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
