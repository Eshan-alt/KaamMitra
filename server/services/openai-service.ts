import OpenAI from "openai";

// Initialize the OpenAI client with the API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Context about Kaam Mitra to help generate more accurate responses
const SYSTEM_PROMPT = `You are Kaam Mitra Assistant, the customer support AI for Kaam Mitra, a hyperlocal job platform connecting daily wage workers (construction workers, plumbers, housemaids, electricians) with employers in their area.

Key features of Kaam Mitra:
- Location-based job matching for local workers and employers
- WhatsApp integration for communication (no app needed)
- Worker verification and rating system
- Separate interfaces for workers and employers
- UPI-based payment system

Your role is to assist users with questions about:
1. How to use the platform
2. Registration and account setup
3. Finding jobs or workers
4. Verification process
5. Payment methods
6. General troubleshooting

Keep responses friendly, clear, and concise. For complex issues beyond your scope, advise users to contact human support at support@kaammitra.com.`;

/**
 * Get a response from the AI customer support assistant
 * @param message User's message/question
 * @returns AI assistant's response
 */
export async function getChatbotResponse(message: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return "I'm having trouble connecting to my knowledge base right now. Please try again later or contact our human support team at support@kaammitra.com.";
  }
}

/**
 * Get job recommendations based on worker skills and preferences
 * @param workerProfile Information about the worker's skills and preferences
 * @returns Personalized job recommendations
 */
export async function getJobRecommendations(workerProfile: {
  primarySkill: string;
  location: string;
  preferredJobTypes?: string[];
}): Promise<string> {
  try {
    const prompt = `As Kaam Mitra's AI assistant, provide personalized job recommendations for a worker with the following profile:
- Primary Skill: ${workerProfile.primarySkill}
- Location: ${workerProfile.location}
${workerProfile.preferredJobTypes ? `- Preferred Job Types: ${workerProfile.preferredJobTypes.join(', ')}` : ''}

Suggest 3-4 types of jobs they could look for on our platform, with brief explanations of why these would be good matches based on their skill set and location. Format as a bulleted list.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I couldn't generate job recommendations right now. Please try again later.";
  } catch (error) {
    console.error("Error generating job recommendations:", error);
    return "I'm having trouble generating job recommendations right now. Please try again later.";
  }
}

/**
 * Get worker hiring tips for employers
 * @param jobDetails Information about the job
 * @returns Personalized hiring tips
 */
export async function getHiringTips(jobDetails: {
  jobTitle: string;
  requiredSkills: string[];
  location: string;
}): Promise<string> {
  try {
    const prompt = `As Kaam Mitra's AI assistant, provide hiring tips for an employer looking to hire for the following position:
- Job Title: ${jobDetails.jobTitle}
- Required Skills: ${jobDetails.requiredSkills.join(', ')}
- Location: ${jobDetails.location}

Provide 4-5 practical tips for finding and selecting the right worker for this job on our platform. Format as a numbered list.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I couldn't generate hiring tips right now. Please try again later.";
  } catch (error) {
    console.error("Error generating hiring tips:", error);
    return "I'm having trouble generating hiring tips right now. Please try again later.";
  }
}