import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    // Get the Gemini API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error("Gemini API key is not configured")
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 })
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        },
      )

      // Log the status and headers for debugging
      console.log("Gemini API response status:", response.status)
      console.log("Gemini API response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Gemini API error response:", errorText)

        try {
          const errorData = JSON.parse(errorText)
          console.error("Parsed Gemini API error:", errorData)
        } catch (e) {
          console.error("Could not parse error response as JSON")
        }

        return NextResponse.json(
          { error: `Failed to get response from Gemini API: ${response.status} ${response.statusText}` },
          { status: response.status },
        )
      }

      const data = await response.json()
      console.log("Gemini API response structure:", JSON.stringify(data, null, 2).substring(0, 200) + "...")

      // Check if the response has the expected structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        console.error("Unexpected Gemini API response structure:", JSON.stringify(data, null, 2))
        return NextResponse.json({ error: "Unexpected response structure from Gemini API", data }, { status: 500 })
      }

      return NextResponse.json({
        result: data.candidates[0].content.parts[0].text,
      })
    } catch (fetchError) {
      console.error("Error fetching from Gemini API:", fetchError)
      return NextResponse.json({ error: `Error fetching from Gemini API: ${fetchError.message}` }, { status: 500 })
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ error: `Failed to process request: ${error.message}` }, { status: 500 })
  }
}
