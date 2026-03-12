/**
 * Quick Links Component
 * Manages and displays favorite website shortcuts
 */

const QuickLinks = {
    // Component state
    links: [],
    container: null,
    nameInput: null,
    urlInput: null,
    addButton: null,
    linksGrid: null,

    /**
     * Generate a UUID v4
     * @returns {string} UUID string
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid
     */
    isValidURL(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }
        const trimmedUrl = url.trim();
        return trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://');
    },

    /**
     * Initialize the quick links component
     * @param {HTMLElement} containerElement - Container element for quick links
     */
    init(containerElement) {
        this.container = containerElement;
        
        // Get DOM elements
        this.nameInput = this.container.querySelector('.link-name-input');
        this.urlInput = this.container.querySelector('.link-url-input');
        this.addButton = this.container.querySelector('.btn-add-link');
        this.linksGrid = this.container.querySelector('.links-grid');

        // Load links from storage
        this.loadLinks();

        // Set up event listeners
        this.addButton.addEventListener('click', () => {
            const name = this.nameInput.value;
            const url = this.urlInput.value;
            
            if (this.addLink(name, url)) {
                // Clear inputs on success
                this.nameInput.value = '';
                this.urlInput.value = '';
            }
        });

        // Allow Enter key to add link
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addButton.click();
            }
        });

        // Render initial links
        this.render();
    },

    /**
     * Load links from storage
     */
    loadLinks() {
        const savedLinks = Storage.getItem('links');
        if (savedLinks && Array.isArray(savedLinks)) {
            this.links = savedLinks;
        } else {
            this.links = [];
        }
    },

    /**
     * Save links to storage
     */
    saveLinks() {
        Storage.setItem('links', this.links);
    },

    /**
     * Add a new link
     * @param {string} name - Link display name
     * @param {string} url - Website URL
     * @returns {boolean} Success status
     */
    addLink(name, url) {
        // Validate inputs
        const trimmedName = name ? name.trim() : '';
        const trimmedUrl = url ? url.trim() : '';

        // Reject empty inputs
        if (!trimmedName || !trimmedUrl) {
            return false;
        }

        // Validate URL format
        if (!this.isValidURL(trimmedUrl)) {
            return false;
        }

        // Create link object
        const link = {
            id: this.generateUUID(),
            name: trimmedName,
            url: trimmedUrl,
            createdAt: Date.now()
        };

        // Add to links array
        this.links.push(link);

        // Save to storage
        this.saveLinks();

        // Re-render
        this.render();

        return true;
    },

    /**
     * Delete a link
     * @param {string} linkId - Link ID
     * @returns {boolean} Success status
     */
    deleteLink(linkId) {
        // Find the link index
        const linkIndex = this.links.findIndex(link => link.id === linkId);
        
        // If link not found, return false
        if (linkIndex === -1) {
            return false;
        }
        
        // Remove link from array
        this.links.splice(linkIndex, 1);
        
        // Save to storage
        this.saveLinks();
        
        // Remove from DOM
        const linkItem = this.linksGrid.querySelector(`[data-link-id="${linkId}"]`);
        if (linkItem) {
            linkItem.remove();
        }
        
        return true;
    },

    /**
     * Open a link in new tab
     * @param {string} url - Website URL
     */
    openLink(url) {
        window.open(url, '_blank');
    },

    /**
     * Render all links
     */
    render() {
        // Clear existing links
        this.linksGrid.innerHTML = '';

        // Render each link
        this.links.forEach(link => {
            this.renderLink(link);
        });
    },

    /**
     * Render a single link
     * @param {Object} link - Link object
     */
    renderLink(link) {
        // Create link item container
        const linkItem = document.createElement('div');
        linkItem.className = 'link-item';
        linkItem.setAttribute('data-link-id', link.id);

        // Create link button
        const linkButton = document.createElement('button');
        linkButton.className = 'link-button';
        linkButton.textContent = link.name;
        linkButton.setAttribute('aria-label', `Open ${link.name}`);
        linkButton.addEventListener('click', () => {
            this.openLink(link.url);
        });

        // Create delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn-delete-link';
        deleteButton.textContent = '×';
        deleteButton.setAttribute('aria-label', `Delete ${link.name}`);
        deleteButton.addEventListener('click', () => {
            this.deleteLink(link.id);
        });

        // Assemble link item
        linkItem.appendChild(linkButton);
        linkItem.appendChild(deleteButton);

        // Add to grid
        this.linksGrid.appendChild(linkItem);
    }
};
