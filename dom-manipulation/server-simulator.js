// server-simulator.js
let serverQuotes = [
  { id: 1, text: "The only way to do great work is to love what you do.", author: "Steve Jobs", timestamp: Date.now() - 86400000 },
  { id: 2, text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", timestamp: Date.now() - 43200000 },
  { id: 3, text: "Stay hungry, stay foolish.", author: "Steve Jobs", timestamp: Date.now() - 21600000 }
];

let quoteIdCounter = 4;

class ServerSimulator {
  static async fetchQuotesFromServer() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      quotes: [...serverQuotes],
      timestamp: Date.now()
    };
  }

  static async postQuoteToServer(quote) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newQuote = {
      ...quote,
      id: quoteIdCounter++,
      timestamp: Date.now()
    };
    
    serverQuotes.push(newQuote);
    
    return {
      success: true,
      quote: newQuote,
      timestamp: Date.now()
    };
  }

  static async postMultipleQuotesToServer(quotes) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newQuotes = quotes.map(quote => ({
      ...quote,
      id: quoteIdCounter++,
      timestamp: Date.now()
    }));
    
    serverQuotes.push(...newQuotes);
    
    return {
      success: true,
      quotes: newQuotes,
      timestamp: Date.now()
    };
  }

  static getServerState() {
    return {
      quotesCount: serverQuotes.length,
      latestTimestamp: Math.max(...serverQuotes.map(q => q.timestamp))
    };
  }
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  window.ServerSimulator = ServerSimulator;
}

export default ServerSimulator;
