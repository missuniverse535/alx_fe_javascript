// script.js

// ========== CONFLICT RESOLUTION FUNCTION ==========
function resolveConflicts(localQuotes, serverQuotes) {
    console.log("Resolving conflicts between local and server data...");
    
    // Create a map for quick lookup
    const quoteMap = new Map();
    
    // First add all server quotes
    serverQuotes.forEach(quote => {
        const key = `${quote.text}-${quote.author}`;
        quoteMap.set(key, {
            ...quote,
            source: 'server',
            conflictResolved: false
        });
    });
    
    // Then handle local quotes (conflict resolution)
    localQuotes.forEach(localQuote => {
        const key = `${localQuote.text}-${localQuote.author}`;
        const existingQuote = quoteMap.get(key);
        
        if (existingQuote) {
            // CONFLICT: Same quote exists in both places
            console.log(`Conflict detected for: "${localQuote.text}"`);
            
            // Resolution strategy: Keep the newer version
            if (localQuote.timestamp > existingQuote.timestamp) {
                // Local version is newer, keep it
                quoteMap.set(key, {
                    ...localQuote,
                    source: 'local (newer)',
                    conflictResolved: true,
                    previousVersion: existingQuote
                });
                showNotification(`Conflict resolved: Kept newer local version of "${localQuote.text.substring(0, 30)}..."`, "info");
            } else {
                // Server version is newer or same, keep server version
                quoteMap.set(key, {
                    ...existingQuote,
                    conflictResolved: true,
                    previousVersion: localQuote
                });
                showNotification(`Conflict resolved: Kept newer server version of "${existingQuote.text.substring(0, 30)}..."`, "info");
            }
        } else {
            // No conflict, just add local quote
            quoteMap.set(key, {
                ...localQuote,
                source: 'local',
                conflictResolved: false
            });
        }
    });
    
    // Convert map back to array
    const resolvedQuotes = Array.from(quoteMap.values());
    
    console.log(`Resolved ${resolvedQuotes.filter(q => q.conflictResolved).length} conflicts`);
    return resolvedQuotes;
}

// ========== UPDATED fetchQuotesFromServer with localStorage update ==========
async function fetchQuotesFromServer() {
    console.log("fetchQuotesFromServer: Fetching data from mock API...");
    
    try {
        showNotification("Fetching quotes from server...", "info");
        
        const response = await fetch('https://jsonplaceholder.typicode.com/posts');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const posts = await response.json();
        console.log(`Received ${posts.length} posts from mock API`);
        
        // Convert posts to quotes format
        const serverQuotes = posts.slice(0, 5).map((post, index) => ({
            id: post.id,
            text: post.title.length > 50 ? post.title.substring(0, 50) + '...' : post.title,
            author: `User ${post.userId}`,
            body: post.body,
            timestamp: Date.now() - (index * 86400000),
            source: 'server'
        }));
        
        // Get current local quotes
        const localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];
        
        // Apply conflict resolution
        const resolvedQuotes = resolveConflicts(localQuotes, serverQuotes);
        
        // Update localStorage with resolved data
        localStorage.setItem('quotes', JSON.stringify(resolvedQuotes));
        
        // Update last fetch time
        localStorage.setItem('lastServerFetch', Date.now().toString());
        
        // SPECIFIC NOTIFICATION TEXT THAT WAS REQUESTED
        showNotification("Quotes synced with server!", "success");
        
        // Update UI
        displayQuotes();
        
        return {
            success: true,
            quotes: resolvedQuotes,
            timestamp: Date.now(),
            conflictsResolved: resolvedQuotes.filter(q => q.conflictResolved).length
        };
        
    } catch (error) {
        console.error("Error fetching from mock API:", error);
        
        // Fallback option
        if (typeof serverSimulator !== 'undefined') {
            try {
                const localResult = await serverSimulator.fetchQuotesFromServer();
                
                // Still apply conflict resolution
                const localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];
                const resolvedQuotes = resolveConflicts(localQuotes, localResult.quotes);
                localStorage.setItem('quotes', JSON.stringify(resolvedQuotes));
                
                showNotification("Quotes synced with server!", "success");
                displayQuotes();
                
                return {
                    ...localResult,
                    conflictsResolved: resolvedQuotes.filter(q => q.conflictResolved).length
                };
            } catch (fallbackError) {
                // Continue to error
            }
        }
        
        showNotification("Failed to sync quotes with server", "error");
        return {
            success: false,
            error: error.message,
            quotes: []
        };
    }
}

// ========== UPDATED syncQuotes function ==========
async function syncQuotes() {
    console.log("syncQuotes: Starting full synchronization...");
    
    try {
        showNotification("Starting sync with server...", "info");
        
        // 1. Fetch from server
        const fetchResult = await fetchQuotesFromServer();
        
        if (!fetchResult.success) {
            throw new Error("Failed to fetch from server");
        }
        
        // 2. Get local quotes (may have been updated by fetchQuotesFromServer)
        const localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];
        
        // 3. Identify quotes to post to server (only local ones without server ID)
        const quotesToSync = localQuotes
            .filter(quote => !quote.id && quote.source !== 'server')
            .slice(0, 2); // Limit to avoid rate limiting
        
        let postedCount = 0;
        
        // 4. Post quotes to server
        for (const quote of quotesToSync) {
            try {
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
                
                if (response.ok) {
                    postedCount++;
                    showNotification(`Posted quote to server: "${quote.text.substring(0, 20)}..."`, "success");
                }
                
                // Delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (postError) {
                console.error("Error posting quote:", postError);
            }
        }
        
        // 5. Update sync timestamp
        const syncTime = Date.now();
        localStorage.setItem('lastSyncTime', syncTime.toString());
        localStorage.setItem('syncCount', (parseInt(localStorage.getItem('syncCount') || '0') + 1).toString());
        
        // 6. Update UI
        updateSyncStatus();
        displayQuotes();
        
        // 7. Show completion notification
        if (postedCount > 0) {
            showNotification(`Sync complete! ${postedCount} quotes uploaded to server`, "success");
        } else {
            showNotification("Sync complete! Data synchronized with server", "success");
        }
        
        // ALSO SHOW ALERT IF REQUESTED
        if (typeof alert !== 'undefined') {
            setTimeout(() => {
                alert("Quotes synced with server!");
            }, 100);
        }
        
        return {
            success: true,
            quotesCount: localQuotes.length,
            postedToServer: postedCount,
            conflictsResolved: fetchResult.conflictsResolved || 0,
            syncTime: syncTime
        };
        
    } catch (error) {
        console.error("Error in syncQuotes:", error);
        showNotification("Sync failed: " + error.message, "error");
        
        // Show alert for error too
        if (typeof alert !== 'undefined') {
            setTimeout(() => {
                alert("Failed to sync quotes with server: " + error.message);
            }, 100);
        }
        
        return {
            success: false,
            error: error.message
        };
    }
}

// ========== UPDATED showNotification function ==========
function showNotification(message, type = 'info') {
    console.log(`Notification [${type}]: ${message}`);
    
    // Also log to console for debugging
    if (type === 'error') {
        console.error('UI Notification Error:', message);
    }
    
    // Create or get notification element
    let notification = document.getElementById('notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        display: block;
        opacity: 1;
        min-width: 250px;
        max-width: 300px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif;
        font-size: 14px;
        transition: opacity 0.3s ease;
    `;
    
    // Set color based on type
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8',
        warning: '#ffc107'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Set message
    notification.textContent = message;
    
    // Add close button
    notification.innerHTML = `
        ${message}
        <button onclick="this.parentElement.style.opacity='0'; setTimeout(()=>this.parentElement.style.display='none', 300)" 
                style="background:none; border:none; color:white; float:right; cursor:pointer; font-weight:bold; margin-left: 10px;">X</button>
    `;
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 4000);
}

// ========== UPDATED displayQuotes with conflict indicators ==========
function displayQuotes() {
    const quotesList = document.getElementById('quotesList');
    if (!quotesList) return;
    
    const quotes = JSON.parse(localStorage.getItem('quotes')) || [];
    
    quotesList.innerHTML = '';
    
    if (quotes.length === 0) {
        quotesList.innerHTML = '<li class="no-quotes">No quotes found. Add some or sync with server!</li>';
        return;
    }
    
    quotes.forEach(quote => {
        const li = document.createElement('li');
        li.className = 'quote-item';
        
        // Add conflict indicator if applicable
        const conflictBadge = quote.conflictResolved ? 
            `<span class="conflict-badge" title="This quote had a conflict that was resolved">⚠️ Resolved</span>` : '';
        
        // Add source indicator
        const sourceBadge = quote.source ? 
            `<span class="source-badge ${quote.source}">${quote.source}</span>` : '';
        
        li.innerHTML = `
            <div class="quote-header">
                ${conflictBadge}
                ${sourceBadge}
            </div>
            <div class="quote-text">"${quote.text || ''}"</div>
            <div class="quote-author">- ${quote.author || 'Unknown'}</div>
            <div class="quote-meta">
                <small>ID: ${quote.id || 'local'}</small>
                <small>${new Date(quote.timestamp || Date.now()).toLocaleString()}</small>
                <small class="sync-info">Last updated: ${new Date(quote.timestamp || Date.now()).toLocaleTimeString()}</small>
            </div>
            ${quote.previousVersion ? 
                `<div class="conflict-info">
                    <small>Previous version was from: ${quote.previousVersion.source || 'unknown'}</small>
                </div>` : ''}
        `;
        quotesList.appendChild(li);
    });
}

// ========== UPDATED updateSyncStatus ==========
function updateSyncStatus() {
    const syncStatus = document.getElementById('syncStatus');
    if (!syncStatus) return;
    
    const lastSync = localStorage.getItem('lastSyncTime');
    const syncCount = localStorage.getItem('syncCount') || '0';
    const lastFetch = localStorage.getItem('lastServerFetch');
    
    let statusText = '';
    
    if (!lastSync) {
        statusText = "Last sync: Never | Sync count: 0";
    } else {
        const syncTime = new Date(parseInt(lastSync));
        const fetchTime = lastFetch ? new Date(parseInt(lastFetch)) : null;
        
        statusText = `Last sync: ${syncTime.toLocaleTimeString()} | Sync count: ${syncCount}`;
        
        if (fetchTime) {
            statusText += ` | Last fetch: ${fetchTime.toLocaleTimeString()}`;
        }
    }
    
    syncStatus.textContent = statusText;
    syncStatus.title = "Click to sync now";
    
    // Make it clickable
    syncStatus.style.cursor = 'pointer';
    syncStatus.style.textDecoration = 'underline';
    syncStatus.onclick = syncQuotes;
}

// ========== ADDITIONAL CONFLICT DETECTION FUNCTION ==========
function detectAndReportConflicts() {
    const quotes = JSON.parse(localStorage.getItem('quotes')) || [];
    const conflicts = quotes.filter(q => q.conflictResolved);
    
    if (conflicts.length > 0) {
        console.log(`Detected ${conflicts.length} resolved conflicts`);
        
        // Show summary notification
        showNotification(`Found ${conflicts.length} resolved conflicts in your data`, "warning");
        
        // Optionally show details
        conflicts.forEach(conflict => {
            console.log(`Conflict: "${conflict.text}" - Kept ${conflict.source} version`);
        });
    }
    
    return conflicts;
}

// ========== INITIALIZATION WITH CONFLICT CHECK ==========
function startPeriodicSync() {
    console.log("Starting periodic sync (every 45 seconds)");
    
    // Initial sync with delay
    setTimeout(() => {
        syncQuotes();
        
        // Check for conflicts after first sync
        setTimeout(detectAndReportConflicts, 2000);
    }, 3000);
    
    // Periodic sync
    setInterval(() => {
        console.log("Periodic sync triggered");
        syncQuotes();
    }, 45000);
}

// ========== SETUP EVENT LISTENERS ==========
function setupEventListeners() {
    // Fetch button - shows alert too
    const fetchBtn = document.getElementById('fetchBtn');
    if (fetchBtn) {
        fetchBtn.addEventListener('click', async () => {
            const result = await fetchQuotesFromServer();
            if (result.success) {
                // Show alert
                alert("Quotes fetched and synced with server!");
            }
        });
    }
    
    // Sync button - shows alert too
    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            const result = await syncQuotes();
            if (result.success) {
                // Alert is already shown in syncQuotes function
            }
        });
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
                alert("Please enter both quote and author!");
                return;
            }
            
            const newQuote = {
                text: text,
                author: author,
                timestamp: Date.now(),
                source: 'local',
                isLocal: true
            };
            
            const quotes = JSON.parse(localStorage.getItem('quotes')) || [];
            quotes.push(newQuote);
            localStorage.setItem('quotes', JSON.stringify(quotes));
            
            textInput.value = '';
            authorInput.value = '';
            
            displayQuotes();
            showNotification("Quote added locally!", "success");
            
            // Auto-sync after a delay
            setTimeout(() => {
                syncQuotes();
            }, 2000);
        });
    }
    
    // Also sync on page visibility change (when user returns to tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log("Page became visible, syncing...");
            syncQuotes();
        }
    });
}

// ========== MAIN INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing Quote Manager with conflict resolution...");
    
    // Make functions globally available
    window.fetchQuotesFromServer = fetchQuotesFromServer;
    window.postQuoteToServer = async function(quote) {
        // Implementation for posting
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    title: quote.text,
                    body: quote.author,
                    userId: 1
                })
            });
            return await response.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    };
    window.syncQuotes = syncQuotes;
    window.showNotification = showNotification;
    window.displayQuotes = displayQuotes;
    window.updateSyncStatus = updateSyncStatus;
    window.resolveConflicts = resolveConflicts;
    window.detectAndReportConflicts = detectAndReportConflicts;
    
    // Setup
    setupEventListeners();
    displayQuotes();
    updateSyncStatus();
    
    // Start sync
    startPeriodicSync();
    
    // Initial conflict check
    setTimeout(detectAndReportConflicts, 5000);
    
    console.log("Quote Manager initialized with conflict resolution");
});
