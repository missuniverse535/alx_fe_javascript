// server-simulator.js
class ServerSimulator {
    constructor() {
        this.quotes = [
            { id: 1, text: "The only way to do great work is to love what you do.", author: "Steve Jobs", timestamp: 1734379200000 },
            { id: 2, text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs", timestamp: 1734465600000 },
            { id: 3, text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", timestamp: 1734552000000 }
        ];
        this.nextId = 4;
    }

    // Simulate network delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Fetch quotes from server (mock API)
    async fetchQuotesFromServer() {
        console.log("Fetching quotes from server...");
        await this.delay(500); // Simulate network delay
        
        return {
            success: true,
            quotes: JSON.parse(JSON.stringify(this.quotes)), // Return copy
            timestamp: Date.now()
        };
    }

    // Post a single quote to server
    async postQuoteToServer(quote) {
        console.log("Posting quote to server:", quote);
        await this.delay(300);
        
        const newQuote = {
            ...quote,
            id: this.nextId++,
            timestamp: Date.now()
        };
        
        this.quotes.push(newQuote);
        
        return {
            success: true,
            quote: newQuote,
            timestamp: Date.now()
        };
    }

    // Post multiple quotes to server
    async postMultipleQuotesToServer(quotes) {
        console.log("Posting multiple quotes to server:", quotes);
        await this.delay(500);
        
        const newQuotes = quotes.map(quote => ({
            ...quote,
            id: this.nextId++,
            timestamp: Date.now()
        }));
        
        this.quotes.push(...newQuotes);
        
        return {
            success: true,
            quotes: newQuotes,
            timestamp: Date.now()
        };
    }

    // Get server status for debugging
    getServerStatus() {
        return {
            totalQuotes: this.quotes.length,
            lastUpdated: this.quotes.length > 0 ? Math.max(...this.quotes.map(q => q.timestamp)) : 0
        };
    }
}

// Create global instance
window.serverSimulator = new ServerSimulator();
