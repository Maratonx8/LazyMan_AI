const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY or GOOGLE_API_KEY");
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

async function generateWithGemini(userPrompt) {
  const systemInstruction = `
You are LazyMan AI, a Roblox builder AI.

Your job:
- read the user's Roblox request
- return ONLY valid JSON
- no markdown
- no explanations
- no code fences
- no extra text

Return format:
{
  "steps": [
    {
      "type": "create_part | create_script | create_local_script | create_module_script | create_screen_gui | create_frame | create_text_label | create_text_button | create_remote_event | create_folder | set_property",
      "name": "ObjectName",
      "parent": "Workspace | ServerScriptService | StarterGui | ReplicatedStorage | StarterPlayerScripts",
      "properties": {},
      "code": ""
    }
  ]
}

Rules:
- For simple object requests, create parts.
- For systems like shop, leaderboard, mining, GUI, inventory, combat, generate the needed scripts and UI objects.
- Keep Roblox Lua code valid and production-usable.
- If the user asks for a system, generate the full system.
- If a field is not needed, omit it.
- Output ONLY JSON.
`.trim();

  const body = {
    system_instruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: [
      {
        parts: [
          {
            text: userPrompt
          }
        ]
      }
    ],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.4,
      maxOutputTokens: 8192
    }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(`Gemini API error ${response.status}: ${raw}`);
  }

  let parsedApi;
  try {
    parsedApi = JSON.parse(raw);
  } catch {
    throw new Error(`Gemini returned non-JSON API payload: ${raw}`);
  }

  const text =
    parsedApi?.candidates?.[0]?.content?.parts?.[0]?.text ||
    parsedApi?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("\n") ||
    "";

  if (!text) {
    throw new Error("Gemini returned empty text.");
  }

  const cleaned = stripCodeFences(text);

  let generated;
  try {
    generated = JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned invalid JSON text: ${cleaned}`);
  }

  if (!generated || !Array.isArray(generated.steps)) {
    throw new Error(`Gemini JSON missing steps array: ${cleaned}`);
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
    const generated = await generateWithGemini(prompt);

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
