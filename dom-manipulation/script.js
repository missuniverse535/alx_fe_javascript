// script.js - Dynamic Quote Generator

// Initial quotes array
let quotes = [
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

// Initialize application
function initApp() {
    // Display initial random quote
    showRandomQuote();
    
    // Render all quotes
    renderQuotesList();
    
    // Update quote count
    updateQuoteCount();
    
    // Add event listeners
    setupEventListeners();
}

// Display a random quote
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
    
    // Create quote display HTML
    const quoteHTML = `
        <div class="quote-text">"${randomQuote.text}"</div>
        <div class="quote-category">${randomQuote.category}</div>
    `;
    
    // Add fade animation
    quoteDisplay.style.opacity = '0';
    setTimeout(() => {
        quoteDisplay.innerHTML = quoteHTML;
        quoteDisplay.style.opacity = '1';
    }, 300);
    
    // Animate the quote display
    quoteDisplay.style.animation = 'none';
    setTimeout(() => {
        quoteDisplay.style.animation = 'fadeIn 0.5s ease-out';
    }, 10);
}

// Create and display add quote form
function createAddQuoteForm() {
    // Toggle form visibility
    addQuoteForm.classList.toggle('active');
    
    // Change button text based on form state
    if (addQuoteForm.classList.contains('active')) {
        toggleFormBtn.textContent = 'Hide Form';
        // Focus on first input field
        newQuoteText.focus();
    } else {
        toggleFormBtn.textContent = 'Add New Quote';
        // Clear form fields
        newQuoteText.value = '';
        newQuoteCategory.value = '';
    }
}

// Add a new quote
function addQuote() {
    const text = newQuoteText.value.trim();
    const category = newQuoteCategory.value.trim();
    
    // Validate inputs
    if (!text || !category) {
        alert('Please fill in both quote text and category');
        return;
    }
    
    // Create new quote object
    const newQuote = {
        text: text,
        category: category
    };
    
    // Add to quotes array
    quotes.push(newQuote);
    
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
    
    // Show success message
    showNotification('Quote added successfully!');
}

// Render all quotes in the list
function renderQuotesList() {
    // Clear current list
    quotesContainer.innerHTML = '';
    
    // Create and append quote items
    quotes.forEach((quote, index) => {
        const quoteItem = document.createElement('div');
        quoteItem.className = 'quote-item';
        quoteItem.dataset.index = index;
        
        quoteItem.innerHTML = `
            <p>"${quote.text}"</p>
            <small>Category: ${quote.category}</small>
        `;
        
        // Add click event to quote item
        quoteItem.addEventListener('click', () => {
            displaySpecificQuote(index);
        });
        
        // Add delete button
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
            e.stopPropagation(); // Prevent triggering the quote item click
            deleteQuote(index);
        });
        
        quoteItem.appendChild(deleteBtn);
        quotesContainer.appendChild(quoteItem);
    });
}

// Display a specific quote
function displaySpecificQuote(index) {
    const quote = quotes[index];
    
    // Animate the transition
    quoteDisplay.style.opacity = '0';
    setTimeout(() => {
        quoteDisplay.innerHTML = `
            <div class="quote-text">"${quote.text}"</div>
            <div class="quote-category">${quote.category}</div>
        `;
        quoteDisplay.style.opacity = '1';
    }, 300);
    
    // Highlight the selected quote in the list
    document.querySelectorAll('.quote-item').forEach(item => {
        item.style.background = 'white';
    });
    
    const selectedItem = document.querySelector(`.quote-item[data-index="${index}"]`);
    if (selectedItem) {
        selectedItem.style.background = '#f0f8ff';
    }
}

// Delete a quote
function deleteQuote(index) {
    if (confirm('Are you sure you want to delete this quote?')) {
        quotes.splice(index, 1);
        renderQuotesList();
        updateQuoteCount();
        showNotification('Quote deleted successfully!');
        
        // If we deleted the currently displayed quote, show a new random one
        showRandomQuote();
    }
}

// Update quote count
function updateQuoteCount() {
    quoteCount.textContent = quotes.length;
    quoteCount.style.animation = 'none';
    setTimeout(() => {
        quoteCount.style.animation = 'fadeIn 0.5s ease-out';
    }, 10);
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    // New quote button
    newQuoteBtn.addEventListener('click', showRandomQuote);
    
    // Toggle form button
    toggleFormBtn.addEventListener('click', createAddQuoteForm);
    
    // Add quote button
    addQuoteBtn.addEventListener('click', addQuote);
    
    // Allow Enter key to add quote in form
    newQuoteText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addQuote();
    });
    
    newQuoteCategory.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addQuote();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Space bar for new quote
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            showRandomQuote();
        }
        
        // Escape to hide form
        if (e.code === 'Escape' && addQuoteForm.classList.contains('active')) {
            createAddQuoteForm();
        }
    });
    
    // Export quotes functionality (bonus)
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export Quotes';
    exportBtn.style.cssText = `
        background: #17a2b8;
        color: white;
        margin-top: 20px;
        width: 100%;
    `;
    exportBtn.addEventListener('click', exportQuotes);
    document.querySelector('.controls').appendChild(exportBtn);
}

// Export quotes as JSON (bonus feature)
function exportQuotes() {
    const quotesJSON = JSON.stringify(quotes, null, 2);
    const blob = new Blob([quotesJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('Quotes exported successfully!');
}

// Import quotes from JSON file (bonus feature)
function importQuotes(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            quotes = quotes.concat(importedQuotes);
            renderQuotesList();
            updateQuoteCount();
            showNotification('Quotes imported successfully!');
        } catch (error) {
            alert('Error importing quotes. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
