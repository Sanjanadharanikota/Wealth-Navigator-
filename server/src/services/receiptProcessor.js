const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google's Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);

async function processReceipt(imageBase64) {
  try {
    if (!process.env.GOOGLE_AI_KEY) {
      console.error('Google AI API key is not configured');
      throw new Error('Server configuration error: Missing API key');
    }

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      console.error('Invalid image data received');
      throw new Error('Invalid image data');
    }

    // For Google's Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    console.log('Sending request to Gemini API...');
    const prompt = `Extract the following key details from this receipt and return as JSON with these fields:
    - amount (total amount as number, most important)
    - merchant (store/company name as string)
    - date (in YYYY-MM-DD format, use today if not found)
    - category (one of: Food, Shopping, Transportation, Bills, Entertainment, Other)
    - items (max 10 most expensive items, each with name and price)
    - tax (if available, otherwise null)
    - paymentMethod (if mentioned, otherwise null)
    
    Keep the response concise. Only include the most important items. 
    If the receipt is very long, prioritize the main items and total.`;
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.split(',')[1] || imageBase64,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log('Received response from Gemini:', text);
    
    // Parse the response
    let data;
    try {
      // Try to extract JSON if the response includes markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
      data = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Raw response:', text);
      throw new Error('Failed to parse receipt data');
    }
    
    return {
      amount: data.amount,
      merchant: data.merchant,
      date: data.date || new Date().toISOString(),
      category: data.category || 'Other'
    };
  } catch (error) {
    console.error('Error in receipt processing:', error);
    throw new Error(`Failed to process receipt: ${error.message}`);
  }
}

module.exports = { processReceipt };