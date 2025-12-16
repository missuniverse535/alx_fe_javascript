// script.js

// ========== CRITICAL: fetchQuotesFromServer using jsonplaceholder mock API ==========
async function fetchQuotesFromServer() {
    console.log("fetchQuotesFromServer: Fetching data from mock API...");
    
    try {
        // Show notification
        showNotification("Fetching quotes from server...", "info");
        
        // USING THE SPECIFIC MOCK API URL
        const response = await fetch('https://jsonplaceholder.typicode.com/posts');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const posts = await response.json();
        console.log(`Received ${posts.length} posts from mock API`);
        
        // Convert posts to quotes format
        const quotes = posts.slice(0, 5).map((post, index) => ({
            id: post.id,
            text: post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title,
            author: `User ${post.userId}`,
            body: post.body,
            timestamp: Date.now() - (index * 86400000), // Simulate different timestamps
            source: 'server'
        }));
        
        // Show success notification
        showNotification(`Fetched ${quotes.length} quotes from server`, "success");
        
        return {
            success: true,
            quotes: quotes,
            timestamp: Date.now(),
            source: 'jsonplaceholder.typicode.com'
        };
        
    } catch (error) {
        console.error("Error fetching from mock API:", error);
        
        // Fallback to local server simulator if online API fails
        if (typeof serverSimulator !== 'undefined') {
            console.log("Falling back to local server simulator");
            try {
                const localResult = await serverSimulator.fetchQuotesFromServer();
                return localResult;
            } catch (fallbackError) {
                // Continue to error handling
            }
        }
        
        showNotification("Failed to fetch quotes: " + error.message, "error");
        return {
            success: false,
            error: error.message,
            quotes: [],
            timestamp: Date.now()
        };
    }
}

// ========== ALSO ADD postQuoteToServer using the same mock API ==========
async function postQuoteToServer(quote) {
    console.log("postQuoteToServer: Posting data to mock API...");
    
    try {
        // USING THE SPECIFIC MOCK API URL
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: quote.text,
                body: quote.author,
                userId: 1
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("Successfully posted to mock API:", result);
        
        // Create a proper quote object from the response
        const serverQuote = {
            id: result.id,
            text: result.title,
            author: `User ${result.userId}`,
            timestamp: Date.now(),
            source: 'server'
        };
        
        showNotification("Quote posted to server successfully!", "success");
        
        return {
            success: true,
            quote: serverQuote,
            serverResponse: result,
            timestamp: Date.now()
        };
        
    } catch (error) {
        console.error("Error posting to mock API:", error);
        
        // Fallback to local server simulator
        if (typeof serverSimulator !== 'undefined') {
            console.log("Falling back to local server simulator");
            try {
                const localResult = await serverSimulator.postQuoteToServer(quote);
                return localResult;
            } catch (fallbackError) {
                // Continue to error handling
            }
        }
        
        showNotification("Failed to post quote: " + error.message, "error");
        return {
            success: false,
            error: error.message
        };
    }
}

// ========== UPDATED syncQuotes function ==========
async function syncQuotes() {
    console.log("syncQuotes: Starting synchronization...");
    
    try {
        showNotification("Starting sync with server...", "info");
        
        // 1. Fetch quotes from mock API
        const serverResult = await fetchQuotesFromServer();
        
        if (!serverResult.success) {
            throw new Error("Failed to fetch from server");
        }
        
        // 2. Get local quotes
        let localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];
        
        // 3. Post local quotes to server (only first 3 to avoid rate limiting)
        const quotesToPost = localQuotes
            .filter(q => !q.id) // Only quotes without server ID
            .slice(0, 3); // Limit to 3
        
        for (const quote of quotesToPost) {
            await postQuoteToServer(quote);
            // Simulate delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // 4. Merge server quotes with local
        const allQuotes = [...serverResult.quotes];
        
        // Add local quotes that aren't duplicates
        localQuotes.forEach(localQuote => {
            const isDuplicate = allQuotes.some(serverQuote => 
                serverQuote.text === localQuote.text || 
                serverQuote.id === localQuote.id
            );
            
            if (!isDuplicate) {
                allQuotes.push(localQuote);
            }
        });
        
        // 5. Update localStorage
        localStorage.setItem('quotes', JSON.stringify(allQuotes));
        localStorage.setItem('lastSyncTime', Date.now().toString());
        
        // 6. Update UI
        if (typeof displayQuotes === 'function') {
            displayQuotes();
        }
        
        showNotification(`Sync complete! ${allQuotes.length} quotes total`, "success");
        
        return {
            success: true,
            quotesCount: allQuotes.length,
            serverQuotes: serverResult.quotes.length,
            localQuotes: localQuotes.length
        };
        
    } catch (error) {
        console.error("Error in syncQuotes:", error);
        showNotification("Sync failed: " + error.message, "error");
        return {
            success: false,
            error: error.message
        };
    }
}

// ========== HELPER FUNCTIONS ==========
function showNotification(message, type = 'info') {
    let notification = document.getElementById('notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            display: none;
            min-width: 250px;
            max-width: 300px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            font-family: Arial, sans-serif;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Set colors
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Show with animation
    notification.style.display = 'block';
    notification.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 3000);
}

function displayQuotes() {
    const quotesList = document.getElementById('quotesList');
    if (!quotesList) return;
    
    const quotes = JSON.parse(localStorage.getItem('quotes')) || [];
    
    quotesList.innerHTML = '';
    
    quotes.forEach(quote => {
        const li = document.createElement('li');
        li.className = 'quote-item';
        li.innerHTML = `
            <div class="quote-text">"${quote.text || ''}"</div>
            <div class="quote-author">- ${quote.author || 'Unknown'}</div>
            <div class="quote-meta">
                <small>ID: ${quote.id || 'local'}</small>
                <small>${new Date(quote.timestamp || Date.now()).toLocaleString()}</small>
                ${quote.source ? `<small>Source: ${quote.source}</small>` : ''}
            </div>
        `;
        quotesList.appendChild(li);
    });
}

function updateSyncStatus() {
    const syncStatus = document.getElementById('syncStatus');
    if (!syncStatus) return;
    
    const lastSync = localStorage.getItem('lastSyncTime');
    if (!lastSync) {
        syncStatus.textContent = "Last sync: Never";
    } else {
        const timeStr = new Date(parseInt(lastSync)).toLocaleTimeString();
        syncStatus.textContent = `Last sync: ${timeStr}`;
    }
}

// ========== INITIALIZATION ==========
function startPeriodicSync() {
    console.log("Starting periodic sync (every 60 seconds)");
    
    // Initial sync
    setTimeout(() => {
        syncQuotes();
    }, 2000);
    
    // Periodic sync every 60 seconds (to respect API rate limits)
    setInterval(() => {
        syncQuotes();
    }, 60000);
}

function setupEventListeners() {
    // Fetch button
    const fetchBtn = document.getElementById('fetchBtn');
    if (fetchBtn) {
        fetchBtn.addEventListener('click', async () => {
            const result = await fetchQuotesFromServer();
            if (result.success) {
                // Merge with local storage
                const localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];
                const allQuotes = [...result.quotes, ...localQuotes];
                
                // Remove duplicates based on text
                const uniqueQuotes = [];
                const seen = new Set();
                
                allQuotes.forEach(quote => {
                    const key = quote.text;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueQuotes.push(quote);
                    }
                });
                
                localStorage.setItem('quotes', JSON.stringify(uniqueQuotes));
                displayQuotes();
            }
        });
    }
    
    // Sync button
    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', syncQuotes);
    }
    
    // Add quote button
    const addBtn = document.getElementById('addQuoteBtn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            const textInput = document.getElementById('quoteText');
            const authorInput = document.getElementById('quoteAuthor');
            
            const text = textInput.value.trim();
            const author = authorInput.value.trim();
            
            if (!text || !author) {
                showNotification("Please enter both quote and author", "error");
                return;
            }
            
            const newQuote = {
                text: text,
                author: author,
                timestamp: Date.now(),
                isLocal: true
            };
            
            const quotes = JSON.parse(localStorage.getItem('quotes')) || [];
            quotes.push(newQuote);
            localStorage.setItem('quotes', JSON.stringify(quotes));
            
            textInput.value = '';
            authorInput.value = '';
            
            displayQuotes();
            showNotification("Quote added locally!", "success");
        });
    }
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing Quote Manager...");
    
    // Make functions available globally
    window.fetchQuotesFromServer = fetchQuotesFromServer;
    window.postQuoteToServer = postQuoteToServer;
    window.syncQuotes = syncQuotes;
    window.showNotification = showNotification;
    window.displayQuotes = displayQuotes;
    
    // Setup UI
    setupEventListeners();
    displayQuotes();
    updateSyncStatus();
    
    // Start background sync
    startPeriodicSync();
    
    console.log("Quote Manager initialized successfully");
});
