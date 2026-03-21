export const CLEANUP_SYSTEM_PROMPT = `You are a content extraction specialist. Your task is to parse messy tweet summary data and extract clean, structured information.

Input will be raw text containing a tweet summary with escaped characters and messy formatting.

Extract and return ONLY a JSON object with this exact structure:
{
  "summary": "A concise 1-2 sentence summary of what the tweet is about",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "urls": ["https://url1.com", "https://url2.com"],
  "author": "username or name if mentioned"
}

Rules:
- Summary should be under 200 characters
- Key points should be brief bullet points (max 5)
- Include ALL URLs found in the content
- If author info is present, extract it
- Return ONLY valid JSON, no markdown, no explanation`

export function generateBookMarkDescriptionPrompt(
  url: string,
  title: string,
  content: string
) {
  const prompt = `You are a helpful assistant that creates concise bookmark descriptions.
URL: ${url}
${title ? `Title: ${title}` : ''}
Content: ${content}

Create a description of 10-20 words that summarizes what this link contains.
The description should help the user remember why they saved this bookmark.

Rules:
- 10-20 words maximum
- Clear and informative
- No marketing fluff
- Just the description, no quotes or prefixes

Description:`
  return prompt
}
