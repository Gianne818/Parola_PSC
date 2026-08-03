import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, language, port, weather, species } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is missing on the server." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const langName = {
      en: "English",
      tl: "Tagalog",
      ceb: "Cebuano",
      hil: "Hiligaynon",
    }[language as 'en' | 'tl' | 'ceb' | 'hil'] || "Tagalog";

    const systemInstruction = `You are Parola AI Lighthouse Advisor, a seasoned maritime safety and fishing hotspot expert built for small-scale Filipino fisherfolk. 
Your tone must be warm, reassuring, highly respectful, and straightforward. 
Write the advice primarily in the chosen language: ${langName}. 

Format your response using clean Markdown with distinct sections:
1. 🌊 **PAGASA Weather & Marine Conditions Advisory**: Analyze wave height (${weather?.waveHeight}m), wind speed (${weather?.windSpeed} km/h from ${weather?.windDirection}), and PAGASA storm signal (${weather?.stormSignal}). Advise if it is safe to sail, or if they should exercise extreme caution or hold sailing.
2. 🐟 **Hotspot Catch Tactics**: Offer smart suggestions for catching ${species} near ${port} based on current sea surface temp (${weather?.temp}°C) and tide level (${weather?.tide}). Recommend bait, depths, or optimal times.
3. ⚓ **Safety & Navigation Warning**: Remind them of navigation hazards, keeping geofence coordinates in mind, and keeping emergency transponders active.

Keep sentences short and punchy so they are easy to read on vessel decks under the sun. Avoid complex scientific jargon.`;

    const userPrompt = `Home Port: ${port}
Weather Status:
- Temperature: ${weather?.temp}°C
- Wind: ${weather?.windSpeed} km/h, ${weather?.windDirection}
- Wave Height: ${weather?.waveHeight} meters
- Tide: ${weather?.tide}
- Storm Signal: ${weather?.stormSignal}
Target Species Family Preference: ${species}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    const text = response.text || "No advice generated.";
    return NextResponse.json({ advice: text });
  } catch (error: any) {
    console.error("Gemini Advisor Route Error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI advice: " + (error.message || error) },
      { status: 500 }
    );
  }
}
