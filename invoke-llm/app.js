import { Groq } from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

//message ke thru LLM ko input dete hai
async function main() {
    const completion = await groq.chat.completions.create({
        temperature: 1,    //temperature controls the randomness of the output from 0 to 2. Higher values (e.g., 0.8) make the output more random, while lower values (e.g., 0.2) make it more focused and deterministic.
        top_p: 0.2,          //top_p is another way to control the randomness of the output. It considers only the most probable tokens whose cumulative probability exceeds the top_p value. For example, if top_p is set to 0.9, it will consider only the tokens that together make up 90% of the probability mass.
        //NOTE: Alter either temperature or top_p to control randomness, but not both simultaneously for best results.
        stop: "adult-content",   //stop is used to specify a token or sequence of tokens that will signal the model to stop generating further output. When the model encounters the specified stop token(s) in its output, it will cease generation and return the response up to that point. This can be useful for controlling the length of the output or ensuring that it doesn't include certain unwanted content.
        frequency_penalty: 1,  //(Rare)frequency_penalty is a parameter between -2.0 and 2.0 that can be used to discourage the model from repeating the same tokens or phrases in its output. A higher frequency penalty (e.g., 0.5) will make the model less likely to repeat tokens, while a lower value (e.g., 0) will allow for more repetition. This can help improve the diversity of the generated text.
        presence_penalty: 1,   //(Rare)presence_penalty is a parameter between -2.0 and 2.0 that can be used to discourage the model from generating tokens that have already appeared in the input or output. A higher presence penalty (e.g., 0.5) will make the model less likely to generate tokens that are already present, while a lower value (e.g., 0) will allow for more repetition of existing tokens. This can help encourage the model to introduce new concepts or ideas in its response.
        max_completion_tokens: 500,  //max_completion_tokens limits the number of tokens in the generated response. This can help manage the length of the output and control costs associated with token usage.
        response_format: {'type': 'json_object'},  //response_format specifies the format in which the model should return its output. In this case, "json_object" indicates that the model should return a structured JSON object, which can be easily parsed and used in applications. This is particularly useful when you want to ensure that the output adheres to a specific structure for further processing.
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system",    //system role is used to set the behavior of the assistant
                content: `You are a VK-ai, a smart review grader assistant. Your task is to analyze given reviews and return sentiment.Classify the review as positive, negative, or neutral.
                You must return the result in valid JSON structure.
                example: {"sentiment": "Positive"}`,  //personna  &&  // structured output so they developer can easily parse the response and use it in their application without needing to implement complex text processing or natural language understanding logic. By providing a clear and consistent format for the output, it simplifies the integration of the LLM's responses into various applications and workflows. && // we can also use zod schema for structured output.
            },
            {
                role: "user",
                content: `Review: These headphones arrived quickly and look great, but the left earcup stopped working after a week of use.
                Sentiment:`,
            }
        ]
    });

    console.log(JSON.parse(completion.choices[0].message.content));
}

main();


//Check out here for structured output: https://console.groq.com/docs/structured-outputs
//Intructor Library is used to verify the output of the LLM against a predefined schema. It helps ensure that the generated response adheres to a specific structure, making it easier to parse and use in applications. By defining a schema, developers can validate the output and handle any discrepancies or errors effectively. This is particularly useful when working with complex data or when integrating LLM responses into larger systems where consistency and reliability are crucial.