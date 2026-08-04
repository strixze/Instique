import { GoogleGenAI } from  "@google/genai"
import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"
import puppeteer from "puppeteer"

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


function formatMessages(messages) {
  return messages
    .map(msg => `${msg.sender.username}: ${msg.message}`)
    .join("\n");
}

async function summarizeChat(messages) {
  const formattedChat = formatMessages(messages);

  const prompt = `
Analyze the following chat conversation and return a structured summary.

Chat:
${formattedChat}

Return output in this JSON format:
{
  "messages": number,
  "timespan": "string",
  "sentiment": "Positive | Neutral | Negative",
  "overview": "2-3 line summary",
  "keyPoints": ["point1", "point2", "point3", "point4"]
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  const data = JSON.parse(response.text);

  return data;
}


export { summarizeChat }