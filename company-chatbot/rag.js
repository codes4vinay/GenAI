/** 
 * Implementation plan
 * Stage 1: Indexing
 * 1. Load the documents (PDFs, Word files, etc.)
 * 2. Chunk the document
 * 3. Generate embeddings for each chunk
 * 4. Store the embeddings in a vector database
 * 
 * Stage 2: Using the chatbot
 * 1. Setup LLM
 * 2. Add retrieval step to the chatbot
 * 3. Pass input + relevant information to the LLM
 * 4. Return the response to the user
 * */

import { indexTheDocument } from "./prepare.js";

const filePath = './cg-internal-docs.pdf';
indexTheDocument(filePath);


