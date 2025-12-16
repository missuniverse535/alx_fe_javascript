// server-simulator.js
// Run with: npx serve . (or any static file server)

const quotes = [
    {
        id: 'server1',
        text: "The server says: Always sync your data!",
        category: "Technology",
        version: 2,
        lastModified: new Date().toISOString(),
        source: 'server'
    },
    {
        id: 'server2',
        text: "Conflict resolution is important in distributed systems.",
        category: "Programming",
        version: 1,
        lastModified: new Date().toISOString(),
        source: 'server'
    }
];

// Simulate server API
if (typeof window !== 'undefined') {
    window.mockServer = {
        getQuotes: () => {
            // Simulate random changes
            if (Math.random() > 0.7) {
                const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                randomQuote.text = `Updated at ${new Date().toLocaleTimeString()}: ${randomQuote.text}`;
                randomQuote.version++;
            }
            
            return new Promise(resolve => {
                setTimeout(() => resolve([...quotes]), 500);
            });
        },
        
        addQuote: (quote) => {
            const newQuote = {
                ...quote,
                id: 'server_' + Date.now(),
                serverVersion: 1,
                serverModified: new Date().toISOString()
            };
            quotes.push(newQuote);
            return Promise.resolve(newQuote);
        }
    };
}
