import Groq from 'groq-sdk'
import dotenv from 'dotenv'
import { tavily } from '@tavily/core'
import NodeCache from 'node-cache';

dotenv.config()

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const cache = new NodeCache({ stdTTL: 60 * 60 * 24 });  //cache with a standard time to live of 24 hour

export async function generate(userMessage, threadId) {

    const baseMessages = [
        {
            role: "system",
            content: `You are smart assistant named VK-GPT created by Vinay Kumar, who answers the asked questions.
                VK-GPT is a chatbot that can answer questions about any topic.
                Please answer in a natural, conversational tone like a helpful assistant would.
                Avoid formatting with bold text, bullet points, or special characters unless absolutely necessary.
                Present information as flowing sentences rather than a structured list.
                Use the most relevant details and skip overly technical information unless asked.
                Keep it concise but informative.
                current date and time is ${new Date().toUTCString()}.
                You have access to following tools:
                1. webSearch({query}): You can use this tool to search the web for information. It takes a query as input and returns the search results.`
        },
    ]

    const messages = cache.get(threadId) ?? baseMessages

    messages.push({
        role: "user",
        content: userMessage
    });

    //max retries
    const MAX_RETRIES = 7;
    let count = 0;

    while (true) {

        if (count > MAX_RETRIES) {
            return "Sorry, I'm having trouble finding the information right now. Please try again later.";
        }

        count++;
        const completions = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            temperature: 0,
            messages: messages,
            tools: [
                {
                    "type": "function",
                    "function": {
                        "name": "webSearch",
                        "description": "Search the web for information.",
                        "parameters": {
                            // JSON Schema object
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "The search query to perform search on the web."
                                }
                            },
                            "required": ["query"]
                        }
                    }
                }
            ],
            tool_choice: "auto"
        });

        messages.push(completions.choices[0].message);

        const toolCalls = completions.choices[0].message.tool_calls;
        if (!toolCalls) {
            //here we end the response
            //store in cache before returning
            cache.set(threadId, messages);
            return completions.choices[0].message.content;
        }

        for (const tool of toolCalls) {
            const functionName = tool.function.name;
            const functionParams = tool.function.arguments;
            if (functionName === "webSearch") {
                const toolResult = await webSearch(JSON.parse(functionParams));  //call the tool function with the parameters
                //console.log(`Tool result : ${toolResult}`);

                //messages have history
                messages.push({
                    tool_call_id: tool.id,
                    role: "tool",
                    name: functionName,
                    content: toolResult,
                })
            }

        }
    }
}



//web search function
async function webSearch({ query }) {
    //Here we will call tavily API 
    console.log("Calling web search...");

    const response = await tvly.search(query);
    //console.log(response);

    const finalResult = response.results.map(result => result.content).join("\n\n");  //join is used to convert array of results into a single string with each result separated by two new lines.

    return finalResult;
}