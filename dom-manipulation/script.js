// Initial array of quote objects
const quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
    { text: "Life is what happens to you while you're busy making other plans.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Dreams" },
    { text: "It is during our darkest moments that we must focus to see the light.", category: "Motivation" },
    { text: "Whoever is happy will make others happy too.", category: "Happiness" }
];

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteButton = document.getElementById('newQuote');

// Function to display a random quote
function showRandomQuote() {
    if (quotes.length === 0) {
        quoteDisplay.innerHTML = '<p>No quotes available. Please add some quotes!</p>';
        return;
    }
    
    // Get a random quote
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];
    
    // Create the quote display element
    quoteDisplay.innerHTML = `
        <div class="quote-card">
            <p class="quote-text">"${randomQuote.text}"</p>
            <p class="quote-category"><strong>Category:</strong> ${randomQuote.category}</p>
        </div>
    `;
}

// Function to add a new quote
function addQuote() {
    const quoteText = document.getElementById('newQuoteText').value.trim();
    const quoteCategory = document.getElementById('newQuoteCategory').value.trim();
    
    // Validate input
    if (!quoteText || !quoteCategory) {
        alert('Please enter both a quote and a category!');
        return;
    }
    
    // Add the new quote to the array
    quotes.push({
        text: quoteText,
        category: quoteCategory
    });
    
    // Clear the input fields
    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    
    // Show confirmation
    alert(`Quote added successfully! Total quotes: ${quotes.length}`);
    
    // Optionally show the new quote
    showRandomQuote();
}

// Function to create the add quote form (dynamically if needed)
function createAddQuoteForm() {
    // Check if form already exists
    if (!document.getElementById('addQuoteForm')) {
        const formContainer = document.createElement('div');
        formContainer.id = 'addQuoteForm';
        formContainer.innerHTML = `
            <h3>Add New Quote</h3>
            <div>
                <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
                <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
                <button onclick="addQuote()">Add Quote</button>
            </div>
        `;
        document.body.appendChild(formContainer);
    }
}

// Function to display quotes by category
function filterQuotesByCategory(category) {
    const filteredQuotes = quotes.filter(quote => quote.category === category);
    
    if (filteredQuotes.length === 0) {
        quoteDisplay.innerHTML = `<p>No quotes found in category: ${category}</p>`;
        return;
    }
    
    // Display all quotes in the category
    let quotesHTML = `<h3>Quotes in "${category}" category:</h3>`;
    filteredQuotes.forEach(quote => {
        quotesHTML += `
            <div class="quote-card">
                <p class="quote-text">"${quote.text}"</p>
            </div>
        `;
    });
    
    quoteDisplay.innerHTML = quotesHTML;
}

// Function to create category filter buttons
function createCategoryFilters() {
    // Get all unique categories
    const categories = [...new Set(quotes.map(quote => quote.category))];
    
    const filterContainer = document.createElement('div');
    filterContainer.id = 'categoryFilters';
    filterContainer.innerHTML = '<h3>Filter by Category:</h3>';
    
    // Create "All" button
    const allButton = document.createElement('button');
    allButton.textContent = 'All';
    allButton.onclick = () => showRandomQuote();
    filterContainer.appendChild(allButton);
    
    // Create buttons for each category
    categories.forEach(category => {
        const button = document.createElement('button');
        button.textContent = category;
        button.onclick = () => filterQuotesByCategory(category);
        filterContainer.appendChild(button);
    });
    
    // Insert after the main title
    const title = document.querySelector('h1');
    title.insertAdjacentElement('afterend', filterContainer);
}

// Initialize the application
function init() {
    // Create category filters
    createCategoryFilters();
    
    // Create add quote form
    createAddQuoteForm();
    
    // Show initial random quote
    showRandomQuote();
    
    // Add event listener for new quote button
    newQuoteButton.addEventListener('click', showRandomQuote);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
