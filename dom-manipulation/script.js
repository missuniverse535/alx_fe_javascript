// script.js - Dynamic Quote Generator with Server Sync & Conflict Resolution

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    // Mock API endpoints
    SERVER_URL: 'https://jsonplaceholder.typicode.com/posts',
    MOCK_API: true, // Set to false to use real API
    
    // Sync settings
    SYNC_INTERVAL: 30000, // 30 seconds
    RETRY_DELAY: 5000, // 5 seconds
    MAX_RETRIES: 3,
    
    // Storage keys
    LOCAL_STORAGE_KEY: 'dynamicQuotesApp',
    SERVER_STORAGE_KEY: 'serverQuotesCache',
    SYNC_META_KEY: 'syncMetadata',
    CONFLICT_LOG_KEY: 'conflictHistory'
};

// ============================================
// STATE MANAGEMENT
// ============================================
let state = {
    quotes: [],
    serverQuotes: [],
    conflicts: [],
    syncInProgress: false,
    lastSync: null,
    syncErrors: 0,
    syncInterval: null,
    online: navigator.onLine
};

// ============================================
// CORE QUOTE FUNCTIONS (from previous tasks)
// ============================================

function loadQuotes() {
    try {
        const stored = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY);
        state.quotes = stored ? JSON.parse(stored) : getDefaultQuotes();
        updateLocalCount();
    } catch (error) {
        console.error('Error loading quotes:', error);
        state.quotes = getDefaultQuotes();
    }
}

function getDefaultQuotes() {
    return [
        { 
            id: generateId(), 
            text: "The only way to do great work is to love what you do.", 
            category: "Inspiration",
            version: 1,
            lastModified: new Date().toISOString(),
            source: 'local'
        },
        { 
            id: generateId(), 
            text: "Life is 10% what happens to us and 90% how we react to it.", 
            category: "Life",
            version: 1,
            lastModified: new Date().toISOString(),
            source: 'local'
        }
    ];
}

function saveQuotes() {
    try {
        localStorage.setItem(CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(state.quotes));
        updateLocalCount();
    } catch (error) {
        console.error('Error saving quotes:', error);
        showNotification('Error saving quotes!', 'error');
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============================================
// SERVER SYNC FUNCTIONS
// ============================================

// Simulate server API call
async function mockApiCall(endpoint, method = 'GET', data = null) {
    console.log(`Mock API: ${method} ${endpoint}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate random failures (10% chance)
    if (Math.random() < 0.1) {
        throw new Error('Mock network error');
    }
    
    // Return mock data
    if (method === 'GET') {
        const cached = localStorage.getItem(CONFIG.SERVER_STORAGE_KEY);
        return cached ? JSON.parse(cached) : [];
    } else if (method === 'POST') {
        // Simulate server response
        const response = {
            id: generateId(),
            ...data,
            serverVersion: 1,
            serverModified: new Date().toISOString()
        };
        
        // Update cache
        const current = JSON.parse(localStorage.getItem(CONFIG.SERVER_STORAGE_KEY) || '[]');
        current.push(response);
        localStorage.setItem(CONFIG.SERVER_STORAGE_KEY, JSON.stringify(current));
        
        return response;
    }
}

// Fetch quotes from server
async function fetchFromServer() {
    try {
        setSyncStatus('syncing', 'Syncing with server...');
        
        let serverData;
        if (CONFIG.MOCK_API) {
            serverData = await mockApiCall(CONFIG.SERVER_URL);
        } else {
            const response = await fetch(CONFIG.SERVER_URL);
            if (!response.ok) throw new Error('Server error');
            serverData = await response.json();
            
            // Transform API response to our format
            serverData = serverData.map(item => ({
                id: item.id.toString(),
                text: item.title + (item.body ? ': ' + item.body : ''),
                category: 'API',
                version: 1,
                lastModified: new Date().toISOString(),
                source: 'server'
            }));
        }
        
        state.serverQuotes = serverData;
        updateServerCount();
        
        // Check for conflicts
        const conflicts = detectConflicts(state.quotes, serverData);
        state.conflicts = conflicts;
        updateConflictCount();
        
        if (conflicts.length > 0) {
            handleConflicts(conflicts);
        }
        
        setSyncStatus('success', 'Sync complete');
        updateLastSync();
        
        return serverData;
    } catch (error) {
        console.error('Error fetching from server:', error);
        setSyncStatus('error', 'Sync failed: ' + error.message);
        state.syncErrors++;
        
        if (state.syncErrors < CONFIG.MAX_RETRIES) {
            setTimeout(fetchFromServer, CONFIG.RETRY_DELAY);
        }
        
        throw error;
    }
}

// Push quotes to server
async function pushToServer() {
    try {
        setSyncStatus('syncing', 'Pushing to server...');
        
        // Only push quotes modified locally
        const localQuotes = state.quotes.filter(q => q.source === 'local' || !q.source);
        
        for (const quote of localQuotes) {
            if (CONFIG.MOCK_API) {
                await mockApiCall(CONFIG.SERVER_URL, 'POST', quote);
            } else {
                await fetch(CONFIG.SERVER_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: quote.text.substring(0, 50),
                        body: quote.text,
                        userId: 1
                    })
                });
            }
            
            // Update quote to mark as synced
            quote.source = 'synced';
            quote.lastModified = new Date().toISOString();
        }
        
        saveQuotes();
        setSyncStatus('success', 'Push complete');
        updateLastSync();
        
    } catch (error) {
        console.error('Error pushing to server:', error);
        setSyncStatus('error', 'Push failed');
        throw error;
    }
}

// Full sync cycle
async function performSync() {
    if (state.syncInProgress) {
        console.log('Sync already in progress');
        return;
    }
    
    state.syncInProgress = true;
    
    try {
        // Pull from server
        await fetchFromServer();
        
        // Apply conflict resolution strategy
        const strategy = document.getElementById('conflictStrategy').value;
        await resolveConflicts(strategy);
        
        // Push to server
        await pushToServer();
        
        showNotification('Sync completed successfully!', 'success');
        
    } catch (error) {
        console.error('Sync error:', error);
        showNotification('Sync failed: ' + error.message, 'error');
    } finally {
        state.syncInProgress = false;
    }
}

// ============================================
// CONFLICT DETECTION & RESOLUTION
// ============================================

// Detect conflicts between local and server data
function detectConflicts(localData, serverData) {
    const conflicts = [];
    
    // Create maps for quick lookup
    const localMap = new Map(localData.map(q => [q.id, q]));
    const serverMap = new Map(serverData.map(q => [q.id, q]));
    
    // Check for conflicts in common quotes
    for (const [id, localQuote] of localMap) {
        const serverQuote = serverMap.get(id);
        
        if (serverQuote) {
            // Check if quotes differ
            if (localQuote.text !== serverQuote.text || 
                localQuote.category !== serverQuote.category ||
                localQuote.version !== serverQuote.version) {
                
                conflicts.push({
                    id,
                    local: localQuote,
                    server: serverQuote,
                    type: 'update',
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    // Check for quotes only on server
    for (const [id, serverQuote] of serverMap) {
        if (!localMap.has(id)) {
            conflicts.push({
                id,
                local: null,
                server: serverQuote,
                type: 'addition',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // Check for quotes only locally
    for (const [id, localQuote] of localMap) {
        if (!serverMap.has(id)) {
            conflicts.push({
                id,
                local: localQuote,
                server: null,
                type: 'deletion',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // Save conflict log
    if (conflicts.length > 0) {
        const log = JSON.parse(localStorage.getItem(CONFIG.CONFLICT_LOG_KEY) || '[]');
        log.push({
            timestamp: new Date().toISOString(),
            count: conflicts.length,
            conflicts: conflicts.map(c => ({ id: c.id, type: c.type }))
        });
        localStorage.setItem(CONFIG.CONFLICT_LOG_KEY, JSON.stringify(log));
    }
    
    return conflicts;
}

// Handle conflicts based on strategy
async function resolveConflicts(strategy = 'server') {
    if (state.conflicts.length === 0) return;
    
    console.log(`Resolving ${state.conflicts.length} conflicts with strategy: ${strategy}`);
    
    switch (strategy) {
        case 'server':
            await resolveWithServerWins();
            break;
        case 'client':
            await resolveWithClientWins();
            break;
        case 'merge':
            await resolveWithMerge();
            break;
        case 'ask':
            showConflictModal();
            return; // Wait for user decision
    }
    
    // Clear conflicts after resolution
    state.conflicts = [];
    updateConflictCount();
    saveQuotes();
}

// Conflict resolution strategies
async function resolveWithServerWins() {
    for (const conflict of state.conflicts) {
        if (conflict.server) {
            // Update local with server data
            const index = state.quotes.findIndex(q => q.id === conflict.id);
            if (index !== -1) {
                state.quotes[index] = { ...conflict.server, source: 'server' };
            } else {
                state.quotes.push({ ...conflict.server, source: 'server' });
            }
        } else if (conflict.local && !conflict.server) {
            // Server deleted it, remove locally
            state.quotes = state.quotes.filter(q => q.id !== conflict.id);
        }
    }
    
    showNotification(`${state.conflicts.length} conflicts resolved (server wins)`, 'warning');
}

async function resolveWithClientWins() {
    // In this strategy, we keep local changes
    // For deletions on server, we keep local version
    // For additions on server, we add them
    
    for (const conflict of state.conflicts) {
        if (conflict.type === 'addition' && conflict.server) {
            // Server added new quote
            state.quotes.push({ ...conflict.server, source: 'server' });
        }
        // For updates, we keep local version (already there)
        // For deletions, we keep local version (already there)
    }
    
    showNotification(`${state.conflicts.length} conflicts resolved (client wins)`, 'warning');
}

async function resolveWithMerge() {
    for (const conflict of state.conflicts) {
        if (conflict.type === 'update' && conflict.local && conflict.server) {
            // Merge text and keep both versions
            const mergedText = `${conflict.local.text} [Also: ${conflict.server.text}]`;
            const mergedCategory = conflict.local.category === conflict.server.category 
                ? conflict.local.category 
                : `${conflict.local.category}/${conflict.server.category}`;
            
            const index = state.quotes.findIndex(q => q.id === conflict.id);
            if (index !== -1) {
                state.quotes[index] = {
                    ...conflict.local,
                    text: mergedText,
                    category: mergedCategory,
                    version: Math.max(conflict.local.version, conflict.server.version) + 1,
                    merged: true
                };
            }
        } else if (conflict.type === 'addition' && conflict.server) {
            // Add server addition
            state.quotes.push({ ...conflict.server, source: 'server' });
        } else if (conflict.type === 'addition' && conflict.local) {
            // Already have local version
        }
    }
    
    showNotification(`${state.conflicts.length} conflicts merged`, 'success');
}

// ============================================
// UI FUNCTIONS
// ============================================

// Update sync status display
function setSyncStatus(status, message) {
    const dot = document.getElementById('syncDot');
    const statusText = document.getElementById('syncStatus');
    
    dot.className = 'sync-dot';
    if (status === 'syncing') {
        dot.classList.add('syncing');
    } else if (status === 'error') {
        dot.classList.add('error');
    }
    
    statusText.textContent = message;
}

// Update last sync time
function updateLastSync() {
    state.lastSync = new Date();
    const timeEl = document.getElementById('lastSyncTime');
    const timestampEl = document.getElementById('syncTimestamp');
    
    if (timeEl) timeEl.textContent = state.lastSync.toLocaleTimeString();
    if (timestampEl) timestampEl.textContent = state.lastSync.toLocaleString();
    
    // Save sync metadata
    localStorage.setItem(CONFIG.SYNC_META_KEY, JSON.stringify({
        lastSync: state.lastSync.toISOString(),
        syncCount: (JSON.parse(localStorage.getItem(CONFIG.SYNC_META_KEY) || '{}').syncCount || 0) + 1
    }));
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Show conflict modal
function showConflictModal() {
    const modal = document.getElementById('conflictModal');
    const list = document.getElementById('conflictList');
    
    list.innerHTML = '';
    
    state.conflicts.forEach(conflict => {
        const item = document.createElement('div');
        item.className = 'conflict-item';
        
        if (conflict.type === 'update') {
            item.innerHTML = `
                <strong>Update Conflict (ID: ${conflict.id})</strong>
                <div style="margin-top: 10px;">
                    <div><strong>Local:</strong> "${conflict.local.text}"</div>
                    <div><strong>Server:</strong> "${conflict.server.text}"</div>
                </div>
            `;
        } else if (conflict.type === 'addition') {
            const source = conflict.server ? 'Server' : 'Local';
            const quote = conflict.server || conflict.local;
            item.innerHTML = `
                <strong>Addition Conflict (${source})</strong>
                <div style="margin-top: 10px;">
                    "${quote.text}"
                </div>
            `;
        }
        
        list.appendChild(item);
    });
    
    modal.style.display = 'flex';
}

// Close conflict modal
function closeConflictModal() {
    document.getElementById('conflictModal').style.display = 'none';
}

// User conflict resolution actions
function useLocalData() {
    resolveWithClientWins();
    closeConflictModal();
}

function useServerData() {
    resolveWithServerWins();
    closeConflictModal();
}

function mergeData() {
    resolveWithMerge();
    closeConflictModal();
}

// Update counts
function updateLocalCount() {
    document.getElementById('localCount').textContent = state.quotes.length;
    document.getElementById('quoteCount').textContent = state.quotes.length;
}

function updateServerCount() {
    document.getElementById('serverCount').textContent = state.serverQuotes.length;
}

function updateConflictCount() {
    document.getElementById('conflictCount').textContent = state.conflicts.length;
}

// ============================================
// EVENT HANDLERS
// ============================================

function manualSync() {
    performSync();
}

function forceServerPull() {
    fetchFromServer();
}

function forceLocalPush() {
    pushToServer();
}

function checkForConflicts() {
    if (state.serverQuotes.length > 0) {
        const conflicts = detectConflicts(state.quotes, state.serverQuotes);
        if (conflicts.length > 0) {
            state.conflicts = conflicts;
            showConflictModal();
        } else {
            showNotification('No conflicts found!', 'success');
        }
    } else {
        showNotification('Please sync with server first', 'warning');
    }
}

// Add quote function
function addQuote() {
    const textInput = document.getElementById('newQuoteText');
    const categoryInput = document.getElementById('newQuoteCategory');
    
    const text = textInput.value.trim();
    const category = categoryInput.value.trim();
    
    if (!text || !category) {
        showNotification('Please fill in both fields', 'error');
        return;
    }
    
    const newQuote = {
        id: generateId(),
        text,
        category,
        version: 1,
        lastModified: new Date().toISOString(),
        source: 'local'
    };
    
    state.quotes.push(newQuote);
    saveQuotes();
    renderQuotes();
    
    // Clear inputs
    textInput.value = '';
    categoryInput.value = '';
    
    showNotification('Quote added locally', 'success');
}

// Render quotes
function renderQuotes() {
    const container = document.getElementById('quotesContainer');
    container.innerHTML = '';
    
    state.quotes.forEach(quote => {
        const div = document.createElement('div');
        div.className = 'quote-item';
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <h4>"${quote.text}"</h4>
                <span class="version-badge ${quote.source === 'local' ? 'local-badge' : 'server-badge'}">
                    v${quote.version} ${quote.source || 'local'}
                </span>
            </div>
            <div class="quote-meta">
                <span>Category: ${quote.category}</span>
                <span>Modified: ${new Date(quote.lastModified).toLocaleString()}</span>
            </div>
            <div class="quote-actions">
                <button class="btn-warning" onclick="editQuote('${quote.id}')">Edit</button>
                <button class="btn-danger" onclick="deleteQuote('${quote.id}')">Delete</button>
            </div>
        `;
        
        container.appendChild(div);
    });
}

function editQuote(id) {
    const quote = state.quotes.find(q => q.id === id);
    if (quote) {
        const newText = prompt('Edit quote text:', quote.text);
        if (newText) {
            quote.text = newText;
            quote.version++;
            quote.lastModified = new Date().toISOString();
            quote.source = 'local';
            saveQuotes();
            renderQuotes();
            showNotification('Quote updated', 'success');
        }
    }
}

function deleteQuote(id) {
    if (confirm('Are you sure you want to delete this quote?')) {
        state.quotes = state.quotes.filter(q => q.id !== id);
        saveQuotes();
        renderQuotes();
        showNotification('Quote deleted', 'success');
    }
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
    // Load data
    loadQuotes();
    
    // Initialize UI
    renderQuotes();
    updateLocalCount();
    updateLastSync();
    
    // Start auto-sync if enabled
    const autoSync = document.getElementById('autoSync');
    if (autoSync && autoSync.checked) {
        state.syncInterval = setInterval(performSync, CONFIG.SYNC_INTERVAL);
    }
    
    // Listen for auto-sync changes
    if (autoSync) {
        autoSync.addEventListener('change', function() {
            if (this.checked) {
                state.syncInterval = setInterval(performSync, CONFIG.SYNC_INTERVAL);
            } else {
                clearInterval(state.syncInterval);
                state.syncInterval = null;
            }
        });
    }
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
        state.online = true;
        setSyncStatus('success', 'Online');
        showNotification('Back online! Syncing...', 'success');
        performSync();
    });
    
    window.addEventListener('offline', () => {
        state.online = false;
        setSyncStatus('error', 'Offline');
        showNotification('You are offline. Changes will sync when back online.', 'warning');
    });
    
    // Initial sync
    setTimeout(performSync, 1000);
}

// Start application
document.addEventListener('DOMContentLoaded', init);
