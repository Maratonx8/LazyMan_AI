const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY");
}

const projectPrompts = {};
const projectSteps = {};

function ensureProject(projectId) {
  if (!projectPrompts[projectId]) projectPrompts[projectId] = [];
  if (!projectSteps[projectId]) projectSteps[projectId] = [];
}

function stripCodeFences(text) {
  if (!text) return "";
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

async function generateWithOpenAI(userPrompt) {
  const systemPrompt = `
You are LazyMan AI, a Roblox builder AI.

Return ONLY valid JSON.
No markdown.
No explanations.
No code fences.
No extra text.

Return format:
{
  "steps": [
    {
      "type": "create_part | create_script | create_local_script | create_module_script | create_screen_gui | create_frame | create_text_label | create_text_button | create_remote_event | create_folder | set_property",
      "name": "ObjectName",
      "parent": "Workspace | ServerScriptService | StarterGui | ReplicatedStorage | StarterPlayer/StarterPlayerScripts",
      "properties": {},
      "size": [0,0,0],
      "position": [0,0,0],
      "color": [255,255,255],
      "anchored": true,
      "text": "",
      "code": "",
      "target": ""
    }
  ]
}

Rules:
- If the user asks for a simple object, create parts.
- If the user asks for a Roblox system like shop, leaderboard, mining, GUI, inventory, combat, generate the needed scripts and UI objects.
- Keep Roblox Lua code valid.
- Output ONLY JSON.
`.trim();

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: userPrompt }]
        }
      ]
    })
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(`OpenAI API error ${response.status}: ${raw}`);
  }

  let parsedApi;
  try {
    parsedApi = JSON.parse(raw);
  } catch {
    throw new Error(`OpenAI returned non-JSON API payload: ${raw}`);
  }

  const text = parsedApi.output_text || "";

  if (!text) {
    throw new Error("OpenAI returned empty output_text.");
  }

  const cleaned = stripCodeFences(text);

  let generated;
  try {
    generated = JSON.parse(cleaned);
  } catch {
    throw new Error(`OpenAI returned invalid JSON text: ${cleaned}`);
  }

  if (!generated || !Array.isArray(generated.steps)) {
    throw new Error(`OpenAI JSON missing steps array: ${cleaned}`);
  }

  return generated;
}

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "LazyMan API" });
});

app.post("/project/:id/prompt", async (req, res) => {
  const projectId = req.params.id;
  const prompt = (req.body?.prompt || "").trim();

  ensureProject(projectId);

  if (!prompt) {
    return res.status(400).json({ ok: false, error: "Missing prompt" });
  }

  projectPrompts[projectId].push(prompt);

  try {
    const generated = await generateWithOpenAI(prompt);
    projectSteps[projectId].push(...generated.steps);

    return res.json({
      ok: true,
      saved: true,
      stepCount: generated.steps.length,
      preview: generated
    });
  } catch (err) {
    console.error("Generation failed:", err);
    return res.status(500).json({
      ok: false,
      error: "generation_failed",
      message: err.message
    });
  }
});

app.get("/project/:id/updates", (req, res) => {
  const projectId = req.params.id;
  ensureProject(projectId);

  const steps = [...projectSteps[projectId]];
  projectSteps[projectId] = [];

  res.json({
    ok: true,
    steps
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LazyMan API running on port ${PORT}`);
});
