import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';


export async function indexTheDocument(filePath) {
    const loader = new PDFLoader(filePath, {splitPages: false});
    const doc = await loader.load();
    console.log(doc[0].pageContent);
    
}