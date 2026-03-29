import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import dotenv from 'dotenv';

dotenv.config();

const embeddings = new OpenAIEmbeddings({
    azureOpenAIApiKey: process.env.OPENAI_API_KEY,
    azureOpenAIApiInstanceName: "vector-embedding-resource",
    azureOpenAIApiDeploymentName: "text-embedding-3-small",
    azureOpenAIApiVersion: "2024-02-15-preview",
});

const pinecone = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY });

const pineconeIndex = pinecone.Index("company-chatbot-index");

const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
});


export async function indexTheDocument(filePath) {
    const loader = new PDFLoader(filePath, { splitPages: false });
    const docs = await loader.load();

    if (!docs || docs.length === 0) {
        throw new Error(`No documents were loaded from path: ${filePath}`);
    }

    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 100 });
    const documents = [];

    for (const doc of docs) {
        if (!doc.pageContent || !doc.pageContent.trim()) {
            continue;
        }

        const texts = await textSplitter.splitText(doc.pageContent);
        for (const chunk of texts) {
            documents.push({
                pageContent: chunk,
                metadata: doc.metadata,
            });
        }
    }

    if (documents.length === 0) {
        console.warn(`No text chunks were generated from file: ${filePath}`);
        return;
    }

    await vectorStore.addDocuments(documents);

}