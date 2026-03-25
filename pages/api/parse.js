export default async function handler(req, res) {
  console.log("API KEY:", process.env.GEMINI_API_KEY);

  const { input } = req.body;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
Extract structured data from this request:

"${input}"

Return ONLY JSON like:
{
  "name": "...",
  "website": "...",
  "search": "..."
}
`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("Gemini response:", data);

const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

if (!text) {
  console.log("No AI text returned");
  return res.status(200).json({
    name: input,
    search: input
  });
}

// extract JSON safely
const jsonMatch = text.match(/\{[\s\S]*\}/);

let parsed;

if (jsonMatch) {
  parsed = JSON.parse(jsonMatch[0]);
} else {
  // fallback
  parsed = {
    name: input,
    search: input
  };
}

res.status(200).json(parsed);
  }
}