/**
 * Property-Based Tests for Quick Links Component
 * Feature: productivity-dashboard
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

// Load the links module code
const linksCode = fs.readFileSync(path.join(__dirname, '../../scripts/links.js'), 'utf8');
const storageCode = fs.readFileSync(path.join(__dirname, '../../scripts/storage.js'), 'utf8');

// Create links DOM
const createLinksDOM = () => {
    const container = document.createElement('div');
    container.className = 'links-container';
    container.innerHTML = `
        <h2>Quick Links</h2>
        <div class="link-input-section">
            <input type="text" class="link-name-input" placeholder="Site name..." maxlength="50" />
            <input type="url" class="link-url-input" placeholder="https://..." />
            <button class="btn-add-link">Add Link</button>
        </div>
        <div class="links-grid">
            <!-- Link buttons will be rendered here dynamically -->
        </div>
    `;
    return container;
};

// Mock Storage
const mockStorage = {
    data: {},
    getItem(key) {
        return this.data[key] !== undefined ? this.data[key] : null;
    },
    setItem(key, value) {
        this.data[key] = value;
        return true;
    },
    removeItem(key) {
        delete this.data[key];
        return true;
    },
    hasItem(key) {
        return this.data[key] !== undefined;
    },
    clear() {
        this.data = {};
    }
};

// Make Storage available globally
global.Storage = mockStorage;

describe('Quick Links Property Tests', () => {
    let container;
    let QuickLinks;

    beforeEach(() => {
        // Setup DOM
        container = createLinksDOM();
        document.body.appendChild(container);
        
        // Clear mock storage
        mockStorage.clear();
        
        // Load storage and links modules into scope
        eval(storageCode);
        QuickLinks = eval(linksCode + '; QuickLinks;');
        
        // Reset links state
        QuickLinks.links = [];
        QuickLinks.container = null;
        QuickLinks.nameInput = null;
        QuickLinks.urlInput = null;
        QuickLinks.addButton = null;
        QuickLinks.linksGrid = null;
        
        // Initialize the links component
        QuickLinks.init(container);
    });

    afterEach(() => {
        // Cleanup
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
    });

    // Feature: productivity-dashboard, Property 15: Link Creation and Display
    // **Validates: Requirements 9.1, 9.2**
    it('Property 15: Link Creation and Display', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                fc.oneof(
                    fc.webUrl(),
                    fc.constant('https://example.com'),
                    fc.constant('http://localhost:3000'),
                    fc.constant('https://github.com/user/repo')
                ),
                (linkName, linkUrl) => {
                    // Clear everything first
                    QuickLinks.links = [];
                    mockStorage.clear();
                    container.querySelector('.links-grid').innerHTML = '';
                    
                    const initialCount = QuickLinks.links.length;
                    
                    // Add a link
                    const result = QuickLinks.addLink(linkName, linkUrl);
                    
                    // Verify link was created successfully
                    expect(result).toBe(true);
                    expect(QuickLinks.links.length).toBe(initialCount + 1);
                    
                    // Get the created link
                    const createdLink = QuickLinks.links[QuickLinks.links.length - 1];
                    
                    // Verify link object properties
                    expect(createdLink).toBeDefined();
                    expect(createdLink.id).toBeDefined();
                    expect(typeof createdLink.id).toBe('string');
                    expect(createdLink.name).toBe(linkName.trim());
                    expect(createdLink.url).toBe(linkUrl.trim());
                    expect(createdLink.createdAt).toBeDefined();
                    expect(typeof createdLink.createdAt).toBe('number');
                    
                    // Verify link is displayed in DOM as clickable button
                    const linkItem = container.querySelector(`[data-link-id="${createdLink.id}"]`);
                    expect(linkItem).toBeTruthy();
                    
                    const linkButton = linkItem.querySelector('.link-button');
                    expect(linkButton).toBeTruthy();
                    expect(linkButton.textContent).toBe(linkName.trim());
                    expect(linkButton.className).toContain('link-button');
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 16: Link Persistence Round-Trip
    // **Validates: Requirements 9.3, 12.1, 12.2**
    it('Property 16: Link Persistence Round-Trip', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        url: fc.oneof(
                            fc.webUrl(),
                            fc.constant('https://example.com'),
                            fc.constant('http://localhost:3000'),
                            fc.constant('https://github.com/user/repo')
                        )
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (linkData) => {
                    // Clear everything first
                    QuickLinks.links = [];
                    mockStorage.clear();
                    container.querySelector('.links-grid').innerHTML = '';
                    
                    // Add all links
                    const addedLinks = [];
                    linkData.forEach(({ name, url }) => {
                        const beforeCount = QuickLinks.links.length;
                        const result = QuickLinks.addLink(name, url);
                        expect(result).toBe(true);
                        
                        // Get the link that was just added
                        const addedLink = QuickLinks.links[beforeCount];
                        addedLinks.push(addedLink);
                    });
                    
                    // Verify all links were saved to storage
                    const savedLinks = mockStorage.getItem('links');
                    expect(savedLinks).toBeDefined();
                    expect(Array.isArray(savedLinks)).toBe(true);
                    expect(savedLinks.length).toBe(linkData.length);
                    
                    // Simulate loading from storage (round-trip)
                    QuickLinks.links = [];
                    QuickLinks.loadLinks();
                    
                    // Verify all links were retrieved correctly
                    expect(QuickLinks.links.length).toBe(linkData.length);
                    
                    // Verify each link has equivalent data
                    addedLinks.forEach((originalLink, index) => {
                        const retrievedLink = QuickLinks.links.find(link => link.id === originalLink.id);
                        
                        expect(retrievedLink).toBeDefined();
                        expect(retrievedLink.id).toBe(originalLink.id);
                        expect(retrievedLink.name).toBe(originalLink.name);
                        expect(retrievedLink.url).toBe(originalLink.url);
                        expect(retrievedLink.createdAt).toBe(originalLink.createdAt);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 17: Invalid Link Rejection
    // **Validates: Requirements 9.4**
    it('Property 17: Invalid Link Rejection', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    // Empty name cases
                    fc.record({
                        name: fc.constant(''),
                        url: fc.oneof(fc.webUrl(), fc.constant('https://example.com'))
                    }),
                    // Whitespace-only name cases
                    fc.record({
                        name: fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 10 }),
                        url: fc.oneof(fc.webUrl(), fc.constant('https://example.com'))
                    }),
                    // Empty URL cases
                    fc.record({
                        name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        url: fc.constant('')
                    }),
                    // Whitespace-only URL cases
                    fc.record({
                        name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        url: fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 10 })
                    }),
                    // Invalid URL format (no http/https)
                    fc.record({
                        name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        url: fc.oneof(
                            fc.constant('example.com'),
                            fc.constant('www.example.com'),
                            fc.constant('ftp://example.com'),
                            fc.constant('javascript:alert(1)')
                        )
                    })
                ),
                (invalidLinkData) => {
                    // Clear everything first
                    QuickLinks.links = [];
                    mockStorage.clear();
                    container.querySelector('.links-grid').innerHTML = '';
                    
                    const initialCount = QuickLinks.links.length;
                    const initialStorageLinks = mockStorage.getItem('links') || [];
                    const initialStorageCount = Array.isArray(initialStorageLinks) ? initialStorageLinks.length : 0;
                    
                    // Attempt to add invalid link
                    const result = QuickLinks.addLink(invalidLinkData.name, invalidLinkData.url);
                    
                    // Verify link was rejected
                    expect(result).toBe(false);
                    
                    // Verify link list remains unchanged
                    expect(QuickLinks.links.length).toBe(initialCount);
                    
                    // Verify storage remains unchanged
                    const finalStorageLinks = mockStorage.getItem('links') || [];
                    const finalStorageCount = Array.isArray(finalStorageLinks) ? finalStorageLinks.length : 0;
                    expect(finalStorageCount).toBe(initialStorageCount);
                    
                    // Verify DOM remains unchanged
                    const linksGrid = container.querySelector('.links-grid');
                    expect(linksGrid.children.length).toBe(initialCount);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Feature: productivity-dashboard, Property 18: Link Navigation
    // **Validates: Requirements 10.1**
    it('Property 18: Link Navigation', () => {
        // Mock window.open
        const originalWindowOpen = global.window.open;
        const windowOpenCalls = [];
        global.window.open = jest.fn((url, target) => {
            windowOpenCalls.push({ url, target });
            return null;
        });

        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                fc.oneof(
                    fc.webUrl(),
                    fc.constant('https://example.com'),
                    fc.constant('http://localhost:3000'),
                    fc.constant('https://github.com/user/repo')
                ),
                (linkName, linkUrl) => {
                    // Clear previous calls
                    windowOpenCalls.length = 0;
                    global.window.open.mockClear();
                    
                    // Clear everything first
                    QuickLinks.links = [];
                    mockStorage.clear();
                    container.querySelector('.links-grid').innerHTML = '';
                    
                    // Add a link
                    QuickLinks.addLink(linkName, linkUrl);
                    const linkId = QuickLinks.links[0].id;
                    
                    // Get the link button
                    const linkButton = container.querySelector(`[data-link-id="${linkId}"] .link-button`);
                    expect(linkButton).toBeTruthy();
                    
                    // Click the link button
                    linkButton.click();
                    
                    // Verify window.open was called with correct parameters
                    expect(global.window.open).toHaveBeenCalledTimes(1);
                    expect(global.window.open).toHaveBeenCalledWith(linkUrl.trim(), '_blank');
                    
                    // Verify the call was recorded
                    expect(windowOpenCalls.length).toBe(1);
                    expect(windowOpenCalls[0].url).toBe(linkUrl.trim());
                    expect(windowOpenCalls[0].target).toBe('_blank');
                }
            ),
            { numRuns: 100 }
        );

        // Restore original window.open
        global.window.open = originalWindowOpen;
    });

    // Feature: productivity-dashboard, Property 19: Link Deletion
    // **Validates: Requirements 11.1, 11.2**
    it('Property 19: Link Deletion', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        url: fc.oneof(
                            fc.webUrl(),
                            fc.constant('https://example.com'),
                            fc.constant('http://localhost:3000')
                        )
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.integer({ min: 0 }),
                (linkData, deleteIndexSeed) => {
                    // Clear everything first
                    QuickLinks.links = [];
                    mockStorage.clear();
                    container.querySelector('.links-grid').innerHTML = '';
                    
                    // Add all links
                    linkData.forEach(({ name, url }) => {
                        QuickLinks.addLink(name, url);
                    });
                    
                    const initialCount = QuickLinks.links.length;
                    expect(initialCount).toBe(linkData.length);
                    
                    // Select a link to delete
                    const deleteIndex = deleteIndexSeed % initialCount;
                    const linkToDelete = QuickLinks.links[deleteIndex];
                    const linkIdToDelete = linkToDelete.id;
                    
                    // Delete the link
                    const result = QuickLinks.deleteLink(linkIdToDelete);
                    
                    // Verify deletion was successful
                    expect(result).toBe(true);
                    
                    // Verify link is removed from links array
                    expect(QuickLinks.links.length).toBe(initialCount - 1);
                    expect(QuickLinks.links.find(link => link.id === linkIdToDelete)).toBeUndefined();
                    
                    // Verify link is removed from storage
                    const savedLinks = mockStorage.getItem('links');
                    expect(savedLinks.length).toBe(initialCount - 1);
                    expect(savedLinks.find(link => link.id === linkIdToDelete)).toBeUndefined();
                    
                    // Verify link is removed from DOM
                    const linkItemInDOM = container.querySelector(`[data-link-id="${linkIdToDelete}"]`);
                    expect(linkItemInDOM).toBeNull();
                    
                    // Verify DOM count matches array count
                    const linksGrid = container.querySelector('.links-grid');
                    expect(linksGrid.children.length).toBe(initialCount - 1);
                }
            ),
            { numRuns: 100 }
        );
    });
});
