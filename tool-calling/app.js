import Groq from 'groq-sdk'
import dotenv from 'dotenv'

dotenv.config()

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
})

async function main() {
    const completions = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        messages: [
            {
                role: "system",
                content: `You are smart personal assistant who answersthe asked questions.
                You have access to following tools:
                1. webSearch({query}): You can use this tool to search the web for information. It takes a query as input and returns the search results.`
            },
            {
                role: "user",
                content: "What was iphone 16 launch date?"
            }
        ],
        tools: [
            {
                "type": "function",
                "function": {
                    "name": "webSearch",
                    "description": "Search the web for information.", //It should be high quality becz LLM will choose which tool to use based on the description and parameters.
                    "parameters": {  //input parameters for the tool function
                        // JSON Schema object
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query to perform search on the web."
                            }
                        },
                        "required": ["query"] //required parameters for the tool function
                    }
                }
            }
        ],
        tool_choice: "auto" //It can be auto or manual. If auto, LLM will decide which tool to use based on the user query and tool description. If manual, user will specify which tool to use in the query.
    });

    const toolCalls = completions.choices[0].message.tool_calls;
    if(!toolCalls) {  //agent tool calls nhi karega kyuki output aa gya LLM se tool calling hui hi nhi
        console.log(`Assistant response: ${completions.choices[0].message.content}`);
        return;
    }

    //LLM ne tool call kiya hai
    //multiple tool call hote hai so use loop
    for (const tool of toolCalls) {
        const functionName = tool.function.name;
        const functionParams = tool.function.arguments;
        if(functionName === "webSearch") {
            const toolResult = await webSearch(JSON.parse(functionParams));  //call the tool function with the parameters
            console.log(`Tool result : ${toolResult}`);
        }
     
    }


    //console.log(JSON.stringify(completions.choices[0].message, null, 2));
}

main();


//Tools for web search : serper.dev , Brave web search API , tavily
//NOTE: LLM can not call the tools directly, we need to implement the tool functions and pass the results back to the LLM. LLM will decide which tool to use based on the user query and tool description. We need to implement the tool functions and pass the results back to the LLM. LLM will use the results to generate the final response to the user query.


//web search function
async function webSearch({ query }) {
    //Here we will call tavily API 
    console.log("Calling web search...");
    
    return "Iphone 16 launch date is September 20, 2024.";
}