export default async function handler(req, res) {
  const { input } = req.body;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // Try parsing JSON from AI
    const parsed = JSON.parse(text);

    res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI parsing failed" });
  }
}