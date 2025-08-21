import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import {JobStream, UpworkJob} from "../types/dao-types";
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});


export const getAiCoverLetter = async (jobPost: UpworkJob, jobStream: JobStream): Promise<string> => {
    try {

        let prompt = `
You are an experienced software engineer
Do not use ** formating

This is the client’s job post at Upwork:
${jobPost.title}
${jobPost.description}

write a cover letter using prompt below:
${jobStream["proposal-prompts"]?.[0]?.prompt}
        `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
        });

        return response.choices[0].message.content ?? '';
    } catch (error: any) {
        console.error('Error generating cover letter:', error.message);
        throw error;
    }
};