// script.js

// ========== CRITICAL: ADD THIS FUNCTION ==========
// Fetch quotes from server using mock API
async function fetchQuotesFromServer() {
    console.log("fetchQuotesFromServer function called");
    
    try {
        // Show notification that we're fetching
        if (typeof showNotification === 'function') {
            showNotification("Fetching quotes from server...", "info");
        }
        
        // Check if server simulator exists
        if (typeof serverSimulator === 'undefined') {
            throw new Error("Server simulator not found");
        }
        
        // Call the mock API
        const result = await serverSimulator.fetchQuotesFromServer();
        
        if (result && result.success) {
            console.log(`Successfully fetched ${result.quotes.length} quotes from server`);
            
            // Show success notification
            if (typeof showNotification === 'function') {
                showNotification(`Fetched ${result.quotes.length} quotes from server`, "success");
            }
            
            // Return the quotes
            return result;
        } else {
            throw new Error("Server returned unsuccessful response");
        }
    } catch (error) {
        console.error("Error in fetchQuotesFromServer:", error);
        
        // Show error notification
        if (typeof showNotification === 'function') {
            showNotification("Failed to fetch quotes from server", "error");
        }
        
        return { 
            success: false, 
            error: error.message,
            quotes: []
        };
    }
}

// ========== ALSO ADD THESE RELATED FUNCTIONS ==========
// Post quote to server using mock API
async function postQuoteToServer(quote) {
    console.log("postQuoteToServer function called");
    
    try {
        // Check if server simulator exists
        if (typeof serverSimulator === 'undefined') {
            throw new Error("Server simulator not found");
        }
        
        // Call the mock API
        const result = await serverSimulator.postQuoteToServer(quote);
        
        if (result && result.success) {
            console.log("Quote posted successfully to server:", result.quote);
            return result;
        } else {
            throw new Error("Failed to post quote to server");
        }
    } catch (error) {
        console.error("Error in postQuoteToServer:", error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// Sync quotes between local and server
async function syncQuotes() {
    console.log("syncQuotes function called");
    
    try {
        // Show notification
        if (typeof showNotification === 'function') {
            showNotification("Starting sync with server...", "info");
        }
        
        // 1. Fetch quotes from server
        const serverResult = await fetchQuotesFromServer();
        
        if (!serverResult.success) {
            throw new Error("Failed to fetch from server");
        }
        
        // 2. Get local quotes
        let localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];
        
        // 3. Identify quotes that only exist locally
        const serverQuoteKeys = new Set();
        serverResult.quotes.forEach(quote => {
            serverQuoteKeys.add(`${quote.text}|${quote.author}`);
        });
        
        const localOnlyQuotes = localQuotes.filter(localQuote => {
            return !serverQuoteKeys.has(`${localQuote.text}|${localQuote.author}`);
        });
        
        // 4. Post local-only quotes to server
        if (localOnlyQuotes.length > 0) {
            console.log(`Found ${localOnlyQuotes.length} local-only quotes to sync`);
            
            for (const quote of localOnlyQuotes) {
                const postResult = await postQuoteToServer(quote);
                if (postResult.success && postResult.quote) {
                    // Update local quote with server ID
                    const index = localQuotes.findIndex(q => 
                        q.text === quote.text && q.author === quote.author
                    );
                    if (index !== -1) {
                        localQuotes[index].id = postResult.quote.id;
                        localQuotes[index].isLocal = false;
                    }
                }
            }
        }
        
        // 5. Merge server quotes with local (handle conflicts)
        const mergedQuotes = [...serverResult.quotes];
        
        // Add local quotes that might have newer timestamps
        localQuotes.forEach(localQuote => {
            const existingIndex = mergedQuotes.findIndex(serverQuote => 
                serverQuote.text === localQuote.text && 
                serverQuote.author === localQuote.author
            );
            
            if (existingIndex === -1) {
                // Quote doesn't exist on server, add it
                mergedQuotes.push(localQuote);
            } else if (localQuote.timestamp > mergedQuotes[existingIndex].timestamp) {
                // Local version is newer, replace
                mergedQuotes[existingIndex] = localQuote;
            }
        });
        
        // 6. Update localStorage
        localStorage.setItem('quotes', JSON.stringify(mergedQuotes));
        
        // 7. Update last sync time
        localStorage.setItem('lastSyncTime', Date.now().toString());
        
        // 8. Refresh display if function exists
        if (typeof displayQuotes === 'function') {
            displayQuotes();
        }
        
        // 9. Update sync status if function exists
        if (typeof updateSyncStatus === 'function') {
            updateSyncStatus();
        }
        
        // Show success notification
        if (typeof showNotification === 'function') {
            showNotification(`Sync complete! ${localOnlyQuotes.length} quotes synced`, "success");
        }
        
        console.log("Sync completed successfully");
        return {
            success: true,
            quotesSynced: localOnlyQuotes.length,
            totalQuotes: mergedQuotes.length
        };
        
    } catch (error) {
        console.error("Error in syncQuotes:", error);
        
        // Show error notification
        if (typeof showNotification === 'function') {
            showNotification("Sync failed: " + error.message, "error");
        }
        
        return {
            success: false,
            error: error.message
        };
    }
}

// ========== IF YOU DON'T HAVE THESE FUNCTIONS, ADD THEM TOO ==========
function showNotification(message, type = 'info') {
    // Try to find notification element
    let notification = document.getElementById('notification');
    
    if (!notification) {
        // Create notification element if it doesn't exist
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
        `;
        document.body.appendChild(notification);
    }
    
    // Set content and style
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Set background color based on type
    if (type === 'success') {
        notification.style.backgroundColor = '#28a745';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#dc3545';
    } else {
        notification.style.backgroundColor = '#17a2b8';
    }
    
    // Show notification
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

// ========== INITIALIZATION ==========
// Make sure these functions are available globally
window.fetchQuotesFromServer = fetchQuotesFromServer;
window.postQuoteToServer = postQuoteToServer;
window.syncQuotes = syncQuotes;
window.showNotification = showNotification;

// Start periodic sync (every 30 seconds)
function startPeriodicSync() {
    console.log("Starting periodic sync (every 30 seconds)");
    
    // Initial sync after 2 seconds
    setTimeout(() => {
        syncQuotes();
    }, 2000);
    
    // Then sync every 30 seconds
    setInterval(() => {
        console.log("Periodic sync triggered");
        syncQuotes();
    }, 30000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("Page loaded, initializing...");
    
    // Make sure buttons are connected
    const fetchBtn = document.getElementById('fetchBtn');
    const syncBtn = document.getElementById('syncBtn');
    
    if (fetchBtn) {
        fetchBtn.addEventListener('click', fetchQuotesFromServer);
    }
    
    if (syncBtn) {
        syncBtn.addEventListener('click', syncQuotes);
    }
    
    // Start periodic sync
    startPeriodicSync();
});
