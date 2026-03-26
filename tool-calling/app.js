import Groq from 'groq-sdk'
import dotenv from 'dotenv'
import { tavily } from '@tavily/core'
import readline from 'node:readline/promises'

dotenv.config()

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
})

async function main() {

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const messages = [
        {
            role: "system",
            content: `You are smart personal assistant who answersthe asked questions.
                current date and time is ${new Date().toUTCString()}.
                You have access to following tools:
                1. webSearch({query}): You can use this tool to search the web for information. It takes a query as input and returns the search results.`
        },
        // {
        //     role: "user",
        //     content: "What was iphone 18 launch date?"
        // }
    ]

    while (true) {

        //Outer loop for user inputs
        const question = await rl.question("You: ");
        messages.push({
            role: "user",
            content: question
        });

        if(question.toLowerCase() === "exit") {
            console.log("Exiting...");
            break;
        }

        while (true) {    //looping for multiple turns of conversation until LLM decides to stop by not calling any tool or giving a final response to the user query.
            const completions = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                temperature: 0,
                messages: messages,
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

            messages.push(completions.choices[0].message); //push the assistant response to the messages array for the next turn of conversation

            const toolCalls = completions.choices[0].message.tool_calls;
            if (!toolCalls) {  //agent tool calls nhi karega kyuki output aa gya LLM se tool calling hui hi nhi
                console.log(`Assistant response: ${completions.choices[0].message.content}`);
                break; //break the loop if LLM does not call any tool, which means LLM has given the final response to the user query.
            }

            //LLM ne tool call kiya hai
            //multiple tool call hote hai so use loop
            for (const tool of toolCalls) {
                const functionName = tool.function.name;
                const functionParams = tool.function.arguments;
                if (functionName === "webSearch") {
                    const toolResult = await webSearch(JSON.parse(functionParams));  //call the tool function with the parameters
                    //console.log(`Tool result : ${toolResult}`);

                    //messages have history
                    messages.push({
                        tool_call_id: tool.id, //id of the tool call for which we are sending the response
                        role: "tool",
                        name: functionName,
                        content: toolResult,
                    })
                }

            }


            //console.log(JSON.stringify(completions.choices[0].message, null, 2));
        }
   }

    rl.close();
}

main();

//we are maintaining the message history and tool call history in the messages array. Whenever LLM calls a tool, we execute the tool function and push the tool result back to the messages array with the corresponding tool_call_id. This way, LLM can use the tool results in the next turn of conversation to generate a more informed response to the user query.
//Tools for web search : serper.dev , Brave web search API , tavily
//NOTE: LLM can not call the tools directly, we need to implement the tool functions and pass the results back to the LLM. LLM will decide which tool to use based on the user query and tool description. We need to implement the tool functions and pass the results back to the LLM. LLM will use the results to generate the final response to the user query.


//web search function
async function webSearch({ query }) {
    //Here we will call tavily API 
    console.log("Calling web search...");

    const response = await tvly.search(query);
    //console.log(response);

    const finalResult = response.results.map(result => result.content).join("\n\n");  //join is used to convert array of results into a single string with each result separated by two new lines.

    return finalResult;
}