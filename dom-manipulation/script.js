// script.js - Dynamic Quote Generator with Advanced Filtering System

// Constants
const STORAGE_KEY = 'dynamicQuotesApp';
const SESSION_KEY = 'quoteSessionData';
const FILTER_KEY = 'quoteFilterPreferences';
const FILTER_HISTORY_KEY = 'filterHistory';
const MAX_STORAGE_SIZE = 5 * 1024 * 1024;

// Initial quotes array
let quotes = [];

// Filter state
let currentFilter = 'all';
let filterHistory = [];
let categoryStats = {};

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const categoryFilter = document.getElementById('categoryFilter');
const categoryTags = document.getElementById('categoryTags');
const activeFilter = document.getElementById('activeFilter');
const currentFilterDisplay = document.getElementById('currentFilter');
const filteredCount = document.getElementById('filteredCount');
const totalCount = document.getElementById('totalCount');
const clearFilterBtn = document.getElementById('clearFilter');
const saveFilterBtn = document.getElementById('saveFilterBtn');
const searchInput = document.getElementById('searchInput');
const filterHistoryContainer = document.getElementById('filterHistory');
const categoryCount = document.getElementById('categoryCount');
const sessionFilter = document.getElementById('sessionFilter');
const categorySuggestions = document.getElementById('existingCategories');

// ============================================
// FILTERING SYSTEM FUNCTIONS
// ============================================

// Populate categories dynamically
function populateCategories() {
    try {
        // Extract unique categories from quotes
        const categories = [...new Set(quotes.map(quote => quote.category))].sort();
        
        // Clear existing options except "All Categories"
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }
        
        // Add category options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
        
        // Update category tags
        updateCategoryTags(categories);
        
        // Update category suggestions
        updateCategorySuggestions(categories);
        
        // Update category stats
        updateCategoryStats();
        
        // Update count display
        categoryCount.textContent = categories.length;
        
        return categories;
    } catch (error) {
        console.error('Error populating categories:', error);
        return [];
    }
}

// Update category tags display
function updateCategoryTags(categories) {
    categoryTags.innerHTML = '';
    
    // Create "All" tag
    const allTag = document.createElement('div');
    allTag.className = `category-tag ${currentFilter === 'all' ? 'active' : ''}`;
    allTag.dataset.category = 'all';
    allTag.innerHTML = `All Categories <span class="count">${quotes.length}</span>`;
    allTag.addEventListener('click', () => applyFilter('all'));
    categoryTags.appendChild(allTag);
    
    // Create category tags
    categories.forEach(category => {
        const count = quotes.filter(q => q.category === category).length;
        const tag = document.createElement('div');
        tag.className = `category-tag ${currentFilter === category ? 'active' : ''}`;
        tag.dataset.category = category;
        tag.innerHTML = `${category} <span class="count">${count}</span>`;
        tag.addEventListener('click', () => applyFilter(category));
        categoryTags.appendChild(tag);
    });
}

// Update category suggestions
function updateCategorySuggestions(categories) {
    if (categories.length > 0) {
        categorySuggestions.textContent = categories.join(', ');
    } else {
        categorySuggestions.textContent = 'None yet';
    }
}

// Update category statistics
function updateCategoryStats() {
    categoryStats = {};
    quotes.forEach(quote => {
        categoryStats[quote.category] = (categoryStats[quote.category] || 0) + 1;
    });
}

// Filter quotes based on selected category
function filterQuotes() {
    try {
        const category = categoryFilter.value;
        applyFilter(category);
    } catch (error) {
        console.error('Error filtering quotes:', error);
    }
}

// Apply filter with animation
function applyFilter(category) {
    // Update current filter
    currentFilter = category;
    
    // Update dropdown
    categoryFilter.value = category;
    
    // Update UI
    updateFilterDisplay();
    renderFilteredQuotes();
    
    // Save filter preference
    saveFilterPreference();
    
    // Add to history
    addToFilterHistory(category);
    
    // Update session display
    sessionFilter.textContent = category === 'all' ? 'All Categories' : category;
}

// Update filter display
function updateFilterDisplay() {
    // Update active filter display
    if (currentFilter === 'all') {
        activeFilter.style.display = 'none';
        currentFilterDisplay.textContent = 'All Categories';
    } else {
        activeFilter.style.display = 'flex';
        currentFilterDisplay.textContent = currentFilter;
    }
    
    // Update category tags active state
    document.querySelectorAll('.category-tag').forEach(tag => {
        tag.classList.toggle('active', tag.dataset.category === currentFilter);
    });
    
    // Update counts
    const filtered = currentFilter === 'all' 
        ? quotes 
        : quotes.filter(q => q.category === currentFilter);
    
    filteredCount.textContent = filtered.length;
    totalCount.textContent = quotes.length;
}

// Render filtered quotes
function renderFilteredQuotes() {
    const quotesContainer = document.getElementById('quotesContainer');
    
    // Clear container
    quotesContainer.innerHTML = '';
    
    // Filter quotes
    let filteredQuotes;
    if (currentFilter === 'all') {
        filteredQuotes = quotes;
    } else {
        filteredQuotes = quotes.filter(quote => quote.category === currentFilter);
    }
    
    // Apply search filter if active
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filteredQuotes = filteredQuotes.filter(quote => 
            quote.text.toLowerCase().includes(searchTerm) ||
            quote.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Display results
    if (filteredQuotes.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = searchTerm 
            ? `No quotes found for "${searchTerm}" in ${currentFilter === 'all' ? 'any category' : currentFilter}`
            : `No quotes found in ${currentFilter === 'all' ? 'any category' : currentFilter}`;
        quotesContainer.appendChild(noResults);
        return;
    }
    
    // Render filtered quotes
    filteredQuotes.forEach((quote, index) => {
        const quoteItem = createQuoteItem(quote, index);
        quoteItem.classList.add('filtered');
        quotesContainer.appendChild(quoteItem);
    });
}

// Create quote item with category badge
function createQuoteItem(quote, index) {
    const quoteItem = document.createElement('div');
    quoteItem.className = 'quote-item';
    quoteItem.dataset.index = index;
    quoteItem.dataset.category = quote.category;
    
    const date = quote.addedAt ? new Date(quote.addedAt).toLocaleDateString() : '';
    
    quoteItem.innerHTML = `
        <div class="category-badge">${quote.category}</div>
        <p>"${quote.text}"</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
            <small>Added: ${date || 'Unknown date'}</small>
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
    return quoteItem;
}

// Clear current filter
function clearFilter() {
    categoryFilter.value = 'all';
    searchInput.value = '';
    applyFilter('all');
}

// Save filter preference to localStorage
function saveFilterPreference() {
    try {
        const preferences = {
            lastFilter: currentFilter,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(FILTER_KEY, JSON.stringify(preferences));
    } catch (error) {
        console.error('Error saving filter preference:', error);
    }
}

// Load filter preference from localStorage
function loadFilterPreference() {
    try {
        const stored = localStorage.getItem(FILTER_KEY);
        if (stored) {
            const preferences = JSON.parse(stored);
            return preferences.lastFilter || 'all';
        }
    } catch (error) {
        console.error('Error loading filter preference:', error);
    }
    return 'all';
}

// Manage filter history
function loadFilterHistory() {
    try {
        const stored = localStorage.getItem(FILTER_HISTORY_KEY);
        if (stored) {
            filterHistory = JSON.parse(stored);
            renderFilterHistory();
        }
    } catch (error) {
        console.error('Error loading filter history:', error);
    }
}

function addToFilterHistory(category) {
    if (category === 'all') return;
    
    // Remove if already exists
    filterHistory = filterHistory.filter(cat => cat !== category);
    
    // Add to beginning
    filterHistory.unshift(category);
    
    // Keep only last 5
    if (filterHistory.length > 5) {
        filterHistory.pop();
    }
    
    // Save and render
    saveFilterHistory();
    renderFilterHistory();
}

function saveFilterHistory() {
    try {
        localStorage.setItem(FILTER_HISTORY_KEY, JSON.stringify(filterHistory));
    } catch (error) {
        console.error('Error saving filter history:', error);
    }
}

function renderFilterHistory() {
    filterHistoryContainer.innerHTML = '';
    
    filterHistory.forEach(category => {
        const tag = document.createElement('div');
        tag.className = 'history-tag';
        tag.textContent = category;
        tag.addEventListener('click', () => applyFilter(category));
        filterHistoryContainer.appendChild(tag);
    });
}

// ============================================
// ENHANCED STORAGE FUNCTIONS
// ============================================

// Save quotes to localStorage (updated)
function saveQuotesToStorage() {
    try {
        const data = {
            quotes: quotes,
            lastUpdated: new Date().toISOString(),
            version: '1.1',
            categories: [...new Set(quotes.map(q => q.category))]
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        updateStorageInfo();
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

// Load quotes from localStorage (updated)
function loadQuotesFromStorage() {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        
        if (storedData) {
            const data = JSON.parse(storedData);
            quotes = data.quotes || [];
            return true;
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
    
    quotes = getDefaultQuotes();
    return false;
}

// ============================================
// ENHANCED QUOTE MANAGEMENT
// ============================================

// Add a new quote (enhanced with category management)
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
    document.getElementById('addQuoteForm').classList.remove('active');
    document.getElementById('toggleForm').textContent = 'Add New Quote';
    
    // Update categories and filters
    populateCategories();
    
    // If current filter is the new category, refresh display
    if (currentFilter === category || currentFilter === 'all') {
        renderFilteredQuotes();
    }
    
    updateQuoteCount();
    showRandomQuote();
}

// Delete a quote (enhanced)
function deleteQuote(index) {
    if (confirm('Are you sure you want to delete this quote?')) {
        const deletedCategory = quotes[index].category;
        quotes.splice(index, 1);
        
        saveQuotesToStorage();
        populateCategories();
        renderFilteredQuotes();
        updateQuoteCount();
        
        // If we deleted the last quote in current category, switch to all
        if (currentFilter === deletedCategory) {
            const remainingInCategory = quotes.filter(q => q.category === deletedCategory);
            if (remainingInCategory.length === 0) {
                applyFilter('all');
            }
        }
        
        showRandomQuote();
    }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function setupSearch() {
    let searchTimeout;
    
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            renderFilteredQuotes();
        }, 300);
    });
    
    // Clear search button (bonus)
    const clearSearch = document.createElement('button');
    clearSearch.textContent = '×';
    clearSearch.style.cssText = `
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #6c757d;
        cursor: pointer;
        font-size: 1.2rem;
        display: none;
    `;
    
    searchInput.parentNode.appendChild(clearSearch);
    
    searchInput.addEventListener('input', () => {
        clearSearch.style.display = searchInput.value ? 'block' : 'none';
    });
    
    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        clearSearch.style.display = 'none';
        renderFilteredQuotes();
    });
}

// ============================================
// INITIALIZATION
// ============================================

function initApp() {
    // Load data from storage
    loadQuotesFromStorage();
    
    // Load filter preferences
    currentFilter = loadFilterPreference();
    loadFilterHistory();
    
    // Initialize categories
    populateCategories();
    
    // Apply saved filter
    categoryFilter.value = currentFilter;
    applyFilter(currentFilter);
    
    // Setup search
    setupSearch();
    
    // Display initial random quote
    showRandomQuote();
    
    // Update counts
    updateQuoteCount();
    
    // Add event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Filtering events
    categoryFilter.addEventListener('change', () => filterQuotes());
    clearFilterBtn.addEventListener('click', clearFilter);
    saveFilterBtn.addEventListener('click', () => {
        saveFilterPreference();
        alert('Filter preference saved!');
    });
    
    // Quote management events
    document.getElementById('newQuote').addEventListener('click', showRandomQuote);
    document.getElementById('toggleForm').addEventListener('click', toggleQuoteForm);
    document.getElementById('addQuote').addEventListener('click', addQuote);
    
    // Enter key support
    document.getElementById('newQuoteText').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addQuote();
    });
    document.getElementById('newQuoteCategory').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addQuote();
    });
    
    // Import/Export events
    document.getElementById('exportBtn').addEventListener('click', exportQuotesToJSON);
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', importQuotesFromJSON);
    document.getElementById('clearStorage').addEventListener('click', clearAllStorage);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            showRandomQuote();
        }
        if (e.code === 'Escape') {
            const form = document.getElementById('addQuoteForm');
            if (form.classList.contains('active')) {
                form.classList.remove('active');
                document.getElementById('toggleForm').textContent = 'Add New Quote';
            }
        }
    });
}

function toggleQuoteForm() {
    const form = document.getElementById('addQuoteForm');
    form.classList.toggle('active');
    document.getElementById('toggleForm').textContent = form.classList.contains('active') 
        ? 'Hide Form' 
        : 'Add New Quote';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', initApp);
