// script.js - Dynamic Quote Generator with Web Storage & JSON Handling

// Constants
const STORAGE_KEY = 'dynamicQuotesApp';
const SESSION_KEY = 'quoteSessionData';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

// Initial quotes array
let quotes = [];

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const toggleFormBtn = document.getElementById('toggleForm');
const addQuoteForm = document.getElementById('addQuoteForm');
const newQuoteText = document.getElementById('newQuoteText');
const newQuoteCategory = document.getElementById('newQuoteCategory');
const addQuoteBtn = document.getElementById('addQuote');
const quotesContainer = document.getElementById('quotesContainer');
const quoteCount = document.getElementById('quoteCount');
const storageStatus = document.getElementById('storageStatus');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const importBtn = document.getElementById('importBtn');
const clearStorageBtn = document.getElementById('clearStorage');
const storedCount = document.getElementById('storedCount');
const lastUpdated = document.getElementById('lastUpdated');
const storageUsed = document.getElementById('storageUsed');
const lastViewed = document.getElementById('lastViewed');
const sessionTime = document.getElementById('sessionTime');

// Session data
let sessionData = {
    startTime: new Date().toISOString(),
    lastViewedQuote: null,
    viewCount: 0
};

// ============================================
// WEB STORAGE FUNCTIONS
// ============================================

// Save quotes to localStorage
function saveQuotesToStorage() {
    try {
        showStorageStatus('Saving...', 'saving');
        
        const data = {
            quotes: quotes,
            lastUpdated: new Date().toISOString(),
            version: '1.0'
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        
        // Update display
        updateStorageInfo();
        showStorageStatus('Saved to storage!', 'saved');
        
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        showStorageStatus('Error saving!', 'error');
        return false;
    }
}

// Load quotes from localStorage
function loadQuotesFromStorage() {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        
        if (storedData) {
            const data = JSON.parse(storedData);
            quotes = data.quotes || [];
            
            // Show success message
            showStorageStatus('Data loaded from storage!', 'saved');
            
            // Update last updated display
            if (data.lastUpdated) {
                const date = new Date(data.lastUpdated);
                document.getElementById('lastUpdated').textContent = 
                    date.toLocaleString();
            }
            
            return true;
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        showStorageStatus('Error loading data!', 'error');
    }
    
    // Load default quotes if no storage data
    quotes = getDefaultQuotes();
    return false;
}

// Save session data to sessionStorage
function saveSessionData() {
    try {
        sessionData.lastViewedQuote = quotes.length > 0 ? 
            quotes[quotes.length - 1] : null;
        sessionData.viewCount++;
        
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        
        // Update session display
        updateSessionDisplay();
        
        return true;
    } catch (error) {
        console.error('Error saving session data:', error);
        return false;
    }
}

// Load session data from sessionStorage
function loadSessionData() {
    try {
        const storedSession = sessionStorage.getItem(SESSION_KEY);
        
        if (storedSession) {
            sessionData = JSON.parse(storedSession);
            updateSessionDisplay();
            return true;
        }
    } catch (error) {
        console.error('Error loading session data:', error);
    }
    
    // Initialize new session
    sessionData = {
        startTime: new Date().toISOString(),
        lastViewedQuote: null,
        viewCount: 0
    };
    
    saveSessionData();
    return false;
}

// Show storage status notification
function showStorageStatus(message, type = 'saved') {
    storageStatus.textContent = message;
    storageStatus.className = `storage-status ${type}`;
    storageStatus.style.display = 'flex';
    
    // Hide after 3 seconds
    setTimeout(() => {
        storageStatus.style.opacity = '0';
        storageStatus.style.transform = 'translateX(100px)';
        
        setTimeout(() => {
            storageStatus.style.display = 'none';
            storageStatus.style.opacity = '1';
            storageStatus.style.transform = 'translateX(0)';
        }, 300);
    }, 3000);
}

// Update storage information display
function updateStorageInfo() {
    try {
        // Calculate storage usage
        const data = localStorage.getItem(STORAGE_KEY);
        const size = data ? new Blob([data]).size : 0;
        
        storedCount.textContent = quotes.length;
        storageUsed.textContent = `${(size / 1024).toFixed(2)} KB`;
        
        // Warn if storage is getting full
        if (size > MAX_STORAGE_SIZE * 0.9) {
            storageUsed.style.color = '#dc3545';
            storageUsed.innerHTML += ' <span style="font-size:0.8em;">(Warning: Almost full!)</span>';
        } else {
            storageUsed.style.color = '#333';
        }
        
    } catch (error) {
        console.error('Error updating storage info:', error);
    }
}

// Update session information display
function updateSessionDisplay() {
    const startTime = new Date(sessionData.startTime);
    sessionTime.textContent = startTime.toLocaleTimeString();
    
    if (sessionData.lastViewedQuote) {
        lastViewed.textContent = `"${sessionData.lastViewedQuote.text.substring(0, 50)}..."`;
    } else {
        lastViewed.textContent = 'None yet';
    }
}

// Clear all storage data
function clearAllStorage() {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
        try {
            // Clear localStorage
            localStorage.removeItem(STORAGE_KEY);
            
            // Clear sessionStorage
            sessionStorage.removeItem(SESSION_KEY);
            
            // Reset quotes to default
            quotes = getDefaultQuotes();
            
            // Reset session data
            sessionData = {
                startTime: new Date().toISOString(),
                lastViewedQuote: null,
                viewCount: 0
            };
            
            // Update UI
            renderQuotesList();
            updateQuoteCount();
            updateStorageInfo();
            updateSessionDisplay();
            showRandomQuote();
            
            showStorageStatus('All data cleared!', 'saved');
            
        } catch (error) {
            console.error('Error clearing storage:', error);
            showStorageStatus('Error clearing data!', 'error');
        }
    }
}

// ============================================
// JSON IMPORT/EXPORT FUNCTIONS
// ============================================

// Export quotes as JSON file
function exportQuotesToJSON() {
    try {
        if (quotes.length === 0) {
            alert('No quotes to export!');
            return;
        }
        
        const exportData = {
            quotes: quotes,
            exportedAt: new Date().toISOString(),
            count: quotes.length,
            app: 'Dynamic Quote Generator'
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `quotes_export_${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        showStorageStatus('Quotes exported successfully!', 'saved');
        
    } catch (error) {
        console.error('Error exporting quotes:', error);
        showStorageStatus('Error exporting!', 'error');
    }
}

// Import quotes from JSON file
function importQuotesFromJSON(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    // Validate file type
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        alert('Please select a valid JSON file.');
        return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('File is too large. Maximum size is 2MB.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate imported data structure
            if (!importedData.quotes || !Array.isArray(importedData.quotes)) {
                throw new Error('Invalid JSON structure. Expected "quotes" array.');
            }
            
            // Validate each quote
            const validQuotes = importedData.quotes.filter(quote => 
                quote && typeof quote.text === 'string' && quote.text.trim() !== '' &&
                typeof quote.category === 'string' && quote.category.trim() !== ''
            );
            
            if (validQuotes.length === 0) {
                throw new Error('No valid quotes found in the file.');
            }
            
            // Check for duplicates
            const existingTexts = new Set(quotes.map(q => q.text.toLowerCase().trim()));
            const newQuotes = validQuotes.filter(quote => 
                !existingTexts.has(quote.text.toLowerCase().trim())
            );
            
            if (newQuotes.length === 0) {
                alert('All quotes in the file already exist in your collection.');
                return;
            }
            
            // Add new quotes
            const oldCount = quotes.length;
            quotes.push(...newQuotes);
            
            // Save to storage
            saveQuotesToStorage();
            
            // Update UI
            renderQuotesList();
            updateQuoteCount();
            
            showStorageStatus(`Imported ${newQuotes.length} new quotes!`, 'saved');
            
            // Reset file input
            event.target.value = '';
            
        } catch (error) {
            console.error('Error importing quotes:', error);
            alert(`Error importing quotes: ${error.message}`);
            showStorageStatus('Import failed!', 'error');
        }
    };
    
    reader.onerror = function() {
        alert('Error reading file. Please try again.');
        showStorageStatus('File read error!', 'error');
    };
    
    reader.readAsText(file);
}

// Import quotes from URL (bonus feature)
async function importQuotesFromURL(url) {
    try {
        showStorageStatus('Fetching quotes...', 'saving');
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const importedData = await response.json();
        
        if (!importedData.quotes || !Array.isArray(importedData.quotes)) {
            throw new Error('Invalid data format from URL');
        }
        
        // Add quotes
        const oldCount = quotes.length;
        quotes.push(...importedData.quotes);
        
        // Save and update
        saveQuotesToStorage();
        renderQuotesList();
        updateQuoteCount();
        
        showStorageStatus(`Added ${quotes.length - oldCount} quotes from URL!`, 'saved');
        
    } catch (error) {
        console.error('Error importing from URL:', error);
        showStorageStatus('URL import failed!', 'error');
    }
}

// ============================================
// CORE APPLICATION FUNCTIONS (Updated)
// ============================================

// Get default quotes (fallback)
function getDefaultQuotes() {
    return [
        {
            text: "The only way to do great work is to love what you do.",
            category: "Inspiration"
        },
        {
            text: "Life is 10% what happens to us and 90% how we react to it.",
            category: "Life"
        },
        {
            text: "The future belongs to those who believe in the beauty of their dreams.",
            category: "Dreams"
        },
        {
            text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            category: "Success"
        },
        {
            text: "In the middle of difficulty lies opportunity.",
            category: "Opportunity"
        }
    ];
}

// Display a random quote (Updated)
function showRandomQuote() {
    if (quotes.length === 0) {
        quoteDisplay.innerHTML = `
            <div class="quote-text">No quotes available. Add some quotes to get started!</div>
            <div class="quote-category">Empty</div>
        `;
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];
    
    // Update session data
    sessionData.lastViewedQuote = randomQuote;
    saveSessionData();
    
    // Display quote
    const quoteHTML = `
        <div class="quote-text">"${randomQuote.text}"</div>
        <div class="quote-category">${randomQuote.category}</div>
    `;
    
    quoteDisplay.style.opacity = '0';
    setTimeout(() => {
        quoteDisplay.innerHTML = quoteHTML;
        quoteDisplay.style.opacity = '1';
    }, 300);
}

// Add a new quote (Updated)
function addQuote() {
    const text = newQuoteText.value.trim();
    const category = newQuoteCategory.value.trim();
    
    // Validate inputs
    if (!text || !category) {
        alert('Please fill in both quote text and category');
        return;
    }
    
    // Check for duplicates
    const isDuplicate = quotes.some(quote => 
        quote.text.toLowerCase() === text.toLowerCase()
    );
    
    if (isDuplicate) {
        alert('This quote already exists in your collection!');
        return;
    }
    
    // Create new quote object
    const newQuote = {
        text: text,
        category: category,
        addedAt: new Date().toISOString()
    };
    
    // Add to quotes array
    quotes.push(newQuote);
    
    // Save to storage
    saveQuotesToStorage();
    
    // Clear form fields
    newQuoteText.value = '';
    newQuoteCategory.value = '';
    
    // Hide form
    addQuoteForm.classList.remove('active');
    toggleFormBtn.textContent = 'Add New Quote';
    
    // Update UI
    showRandomQuote();
    renderQuotesList();
    updateQuoteCount();
}

// Delete a quote (Updated)
function deleteQuote(index) {
    if (confirm('Are you sure you want to delete this quote?')) {
        quotes.splice(index, 1);
        
        // Save to storage
        saveQuotesToStorage();
        
        // Update UI
        renderQuotesList();
        updateQuoteCount();
        
        showStorageStatus('Quote deleted!', 'saved');
        
        // If we deleted the currently displayed quote, show a new random one
        showRandomQuote();
    }
}

// Render quotes list (Updated)
function renderQuotesList() {
    quotesContainer.innerHTML = '';
    
    quotes.forEach((quote, index) => {
        const quoteItem = document.createElement('div');
        quoteItem.className = 'quote-item';
        quoteItem.dataset.index = index;
        
        const date = quote.addedAt ? new Date(quote.addedAt).toLocaleDateString() : '';
        
        quoteItem.innerHTML = `
            <p>"${quote.text}"</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <small>Category: ${quote.category}</small>
                ${date ? `<small style="color: #888;">Added: ${date}</small>` : ''}
            </div>
        `;
        
        quoteItem.addEventListener('click', () => {
            displaySpecificQuote(index);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.style.cssText = `
            background: #dc3545;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
            font-size: 0.8rem;
        `;
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteQuote(index);
        });
        
        quoteItem.appendChild(deleteBtn);
        quotesContainer.appendChild(quoteItem);
    });
}

// Update quote count (Updated)
function updateQuoteCount() {
    quoteCount.textContent = quotes.length;
    updateStorageInfo();
}

// ============================================
// INITIALIZATION
// ============================================

function initApp() {
    // Load data from storage
    loadQuotesFromStorage();
    loadSessionData();
    
    // Display initial random quote
    showRandomQuote();
    
    // Render all quotes
    renderQuotesList();
    
    // Update counts
    updateQuoteCount();
    
    // Add event listeners
    setupEventListeners();
    
    // Check storage compatibility
    if (!isStorageAvailable('localStorage')) {
        alert('Warning: localStorage is not available. Your data will not be saved between sessions.');
    }
}

function setupEventListeners() {
    // Quote management
    newQuoteBtn.addEventListener('click', showRandomQuote);
    toggleFormBtn.addEventListener('click', () => {
        addQuoteForm.classList.toggle('active');
        toggleFormBtn.textContent = addQuoteForm.classList.contains('active') 
            ? 'Hide Form' 
            : 'Add New Quote';
    });
    addQuoteBtn.addEventListener('click', addQuote);
    
    // Enter key support in form
    newQuoteText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addQuote();
    });
    newQuoteCategory.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addQuote();
    });
    
    // Import/Export
    exportBtn.addEventListener('click', exportQuotesToJSON);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importQuotesFromJSON);
    clearStorageBtn.addEventListener('click', clearAllStorage);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            showRandomQuote();
        }
        if (e.code === 'Escape' && addQuoteForm.classList.contains('active')) {
            addQuoteForm.classList.remove('active');
            toggleFormBtn.textContent = 'Add New Quote';
        }
    });
    
    // Save data before page unload
    window.addEventListener('beforeunload', () => {
        saveQuotesToStorage();
        saveSessionData();
    });
    
    // Auto-save every minute (optional)
    setInterval(() => {
        saveQuotesToStorage();
    }, 60000);
}

// Check if storage is available
function isStorageAvailable(type) {
    try {
        const storage = window[type];
        const testKey = '__storage_test__';
        storage.setItem(testKey, testKey);
        storage.removeItem(testKey);
        return true;
    } catch (error) {
        return false;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', initApp);
