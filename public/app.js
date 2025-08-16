// Global variables
let currentSessionId = generateSessionId();
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

function generateSessionId() {
    const randomPart = crypto.randomUUID(); // Node.js 18+ or browser crypto API
    return `DME-agent--@copyrights-${randomPart}`;
}


// Update UI elements
function updateStatus(message, className = '') {
    const status = document.getElementById('status');
    if (status) {
        status.textContent = message;
        status.className = `status ${className}`;
    }
}

// Enhanced function to format property listings with fixed multi-line feature handling
function formatPropertyText(text) {
    // Property feature icons mapping
    const featureIcons = {
        'compound name': '🏘️',
        'location': '📍',
        'property type': '🏠',
        'total property size': '📐',
        'built-up area': '📐',
        'land area': '📐',
        'roof': '📐',
        'bedrooms': '🛏️',
        'number of bedrooms': '🛏️',
        'bathrooms': '🚿',
        'number of bathrooms': '🚿',
        'bedroom & bathroom details': '🚪',
        'bedrooms and bathrooms details': '🚪',
        'bedrooms & bathrooms details': '🚪',
        'all amenities': '✨',
        'amenities': '✨',
        'total price': '💰',
        'payment plan': '💳',
        'additional information': 'ℹ️',
        'images': '📸',
        // Contact information fields
        'email': '📧',
        'e-mail': '📧',
        'email address': '📧',
        'contact email': '📧',
        'phone': '📞',
        'phone number': '📞',
        'mobile': '📱',
        'mobile number': '📱',
        'contact number': '📞',
        'telephone': '📞',
        'whatsapp': '📱',
        'contact': '📞',
        'contact information': '📞'
    };

    // Helper function to format contact information
    function formatContactInfo(value, icon) {
        if (icon === '📧') {
            // Format email as clickable link
            if (value.includes('@')) {
                return `<a href="mailto:${value}" class="contact-link">${value}</a>`;
            }
        } else if (icon === '📞' || icon === '📱') {
            // Format phone number as clickable link
            const cleanNumber = value.replace(/[^\d+]/g, '');
            if (cleanNumber) {
                return `<a href="tel:${cleanNumber}" class="contact-link">${value}</a>`;
            }
        }
        return value;
    }

    // Helper function to convert Google Drive URLs to direct image URLs
    function convertGoogleDriveUrl(url) {
        if (url.includes('drive.google.com')) {
            const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (fileId) {
                return `https://drive.google.com/uc?export=view&id=${fileId[1]}`;
            }
        }
        return url;
    }

    // First, handle markdown-style bold formatting (**text**)
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Split text into lines for processing
    let lines = text.split('\n');
    let formattedLines = [];
    let inPropertyListing = false;
    let currentFeatureContainer = null;
    let pendingFeatureContent = [];

    function flushPendingFeature() {
        if (currentFeatureContainer && pendingFeatureContent.length > 0) {
            const content = pendingFeatureContent.join('<br>');
            const completeFeature = currentFeatureContainer.replace('</div>', ` ${content}</div>`);
            formattedLines.push(completeFeature);
            currentFeatureContainer = null;
            pendingFeatureContent = [];
        } else if (currentFeatureContainer) {
            formattedLines.push(currentFeatureContainer);
            currentFeatureContainer = null;
        }
    }

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        if (!line) {
            // Empty line - if we have pending feature content, add it as a break
            if (currentFeatureContainer) {
                pendingFeatureContent.push('');
            } else {
                flushPendingFeature();
                formattedLines.push('<br>');
            }
            continue;
        }

        // Check for markdown headers (### Property Details)
        if (line.startsWith('### ')) {
            flushPendingFeature();
            
            if (inPropertyListing) {
                formattedLines.push('</div>'); // Close previous property
            }
            
            // Start new property container without numbering
            formattedLines.push(`<div class="property-item">`);
            formattedLines.push(`<div class="property-header">🏠 ${line.replace('### ', '')}</div>`);
            inPropertyListing = true;
            continue;
        }

        // Check if this is a numbered property (1. 2. 3. etc.) - remove numbering
        if (/^\d+\.\s/.test(line)) {
            flushPendingFeature();
            
            if (inPropertyListing) {
                formattedLines.push('</div>'); // Close previous property
            }
            
            // Start new property container without the number
            formattedLines.push(`<div class="property-item">`);
            formattedLines.push(`<div class="property-header">🏠 Property Details</div>`);
            inPropertyListing = true;
            
            // Process the rest of the line after the number
            line = line.replace(/^\d+\.\s*/, '');
            if (!line) continue; // Skip if nothing left after removing number
        }

        // Handle bullet points with dashes (- Item)
        if (line.startsWith('- ') && inPropertyListing) {
            const content = line.substring(2).trim();
            
            // Check if it's a feature with colon (like "- Built-up area: 290 sqm")
            const colonIndex = content.indexOf(':');
            if (colonIndex > 0) {
                // This is a property feature, not content for a pending feature
                flushPendingFeature();
                
                const featureName = content.substring(0, colonIndex).trim().toLowerCase();
                const featureValue = content.substring(colonIndex + 1).trim();
                
                // Find appropriate icon
                let icon = '🏷️'; // default icon
                for (const [feature, featureIcon] of Object.entries(featureIcons)) {
                    if (featureName.includes(feature) || feature.includes(featureName)) {
                        icon = featureIcon;
                        break;
                    }
                }
                
                // If there's a value, create complete feature, otherwise prepare for multi-line
                if (featureValue) {
                    // Special handling for contact information
                    if (icon === '📧' || icon === '📞' || icon === '📱') {
                        line = `<div class="property-feature contact-info"><span class="feature-icon">${icon}</span><strong>${content.substring(0, colonIndex)}:</strong> ${formatContactInfo(featureValue, icon)}</div>`;
                    } else {
                        line = `<div class="property-feature"><span class="feature-icon">${icon}</span><strong>${content.substring(0, colonIndex)}:</strong> ${featureValue}</div>`;
                    }
                    formattedLines.push(line);
                    continue;
                } else {
                    // Prepare for multi-line content
                    const featureTitle = content.substring(0, colonIndex);
                    if (icon === '📧' || icon === '📞' || icon === '📱') {
                        currentFeatureContainer = `<div class="property-feature contact-info"><span class="feature-icon">${icon}</span><strong>${featureTitle}:</strong></div>`;
                    } else {
                        currentFeatureContainer = `<div class="property-feature"><span class="feature-icon">${icon}</span><strong>${featureTitle}:</strong></div>`;
                    }
                    continue;
                }
            } else {
                // Simple bullet point - if we have a pending feature, add it as content
                if (currentFeatureContainer) {
                    pendingFeatureContent.push(`• ${content}`);
                    continue;
                } else {
                    // Standalone bullet point
                    line = `<div class="property-sub-item"><span class="feature-icon">•</span> ${content}</div>`;
                    formattedLines.push(line);
                    continue;
                }
            }
        }

        // Check for property features and add appropriate icons
        let isPropertyFeature = false;
        
        // Check for features with <strong> tags and colons
        const boldMatch = line.match(/<strong>(.*?):\s*<\/strong>(.*)/i);
        if (boldMatch && inPropertyListing) {
            flushPendingFeature();
            
            const featureName = boldMatch[1].toLowerCase();
            const featureValue = boldMatch[2].trim();
            
            // Try to find a matching icon or use a default
            let icon = '🏷️'; // default icon
            for (const [feature, featureIcon] of Object.entries(featureIcons)) {
                if (featureName.includes(feature) || feature.includes(featureName)) {
                    icon = featureIcon;
                    break;
                }
            }
            
            // If there's content after the colon, include it, otherwise prepare for multi-line content
            if (featureValue) {
                // Special handling for contact information
                if (icon === '📧' || icon === '📞' || icon === '📱') {
                    line = `<div class="property-feature contact-info"><span class="feature-icon">${icon}</span><strong>${boldMatch[1]}:</strong> ${formatContactInfo(featureValue, icon)}</div>`;
                } else {
                    line = `<div class="property-feature"><span class="feature-icon">${icon}</span><strong>${boldMatch[1]}:</strong> ${featureValue}</div>`;
                }
                formattedLines.push(line);
            } else {
                // Prepare for multi-line content
                if (icon === '📧' || icon === '📞' || icon === '📱') {
                    currentFeatureContainer = `<div class="property-feature contact-info"><span class="feature-icon">${icon}</span><strong>${boldMatch[1]}:</strong></div>`;
                } else {
                    currentFeatureContainer = `<div class="property-feature"><span class="feature-icon">${icon}</span><strong>${boldMatch[1]}:</strong></div>`;
                }
            }
            isPropertyFeature = true;
        } else {
            // Check for simple feature patterns (without <strong> tags)
            for (const [feature, icon] of Object.entries(featureIcons)) {
                const simpleRegex = new RegExp(`^\\s*-?\\s*${feature}:\\s*`, 'i');
                if (simpleRegex.test(line)) {
                    flushPendingFeature();
                    
                    const value = line.replace(simpleRegex, '').trim();
                    
                    if (value) {
                        // Special handling for contact information
                        if (icon === '📧' || icon === '📞' || icon === '📱') {
                            line = `<div class="property-feature contact-info"><span class="feature-icon">${icon}</span><strong>${feature.charAt(0).toUpperCase() + feature.slice(1)}:</strong> ${formatContactInfo(value, icon)}</div>`;
                        } else {
                            line = `<div class="property-feature"><span class="feature-icon">${icon}</span><strong>${feature.charAt(0).toUpperCase() + feature.slice(1)}:</strong> ${value}</div>`;
                        }
                        formattedLines.push(line);
                    } else {
                        // Prepare for multi-line content
                        if (icon === '📧' || icon === '📞' || icon === '📱') {
                            currentFeatureContainer = `<div class="property-feature contact-info"><span class="feature-icon">${icon}</span><strong>${feature.charAt(0).toUpperCase() + feature.slice(1)}:</strong></div>`;
                        } else {
                            currentFeatureContainer = `<div class="property-feature"><span class="feature-icon">${icon}</span><strong>${feature.charAt(0).toUpperCase() + feature.slice(1)}:</strong></div>`;
                        }
                    }
                    isPropertyFeature = true;
                    break;
                }
            }
        }

        if (!isPropertyFeature) {
            // Handle image links - convert Google Drive links to viewable images
            if (line.includes('![Image')) {
                flushPendingFeature();
                
                line = line.replace(/!\[Image \d+\]\((.*?)\)/g, (match, url) => {
                    // Convert Google Drive share links to direct image URLs
                    const directUrl = convertGoogleDriveUrl(url);
                    return `<div class="property-feature">
                        <span class="feature-icon">📸</span>
                        <div class="image-container">
                            <img src="${directUrl}" alt="Property Image" class="property-thumbnail" onclick="openImageModal('${directUrl}')" />
                            <span class="image-label">Click to enlarge</span>
                        </div>
                    </div>`;
                });
                formattedLines.push(line);
            } else if (currentFeatureContainer) {
                // This line is content for the current feature
                pendingFeatureContent.push(line);
            } else {
                // Regular line - just add it
                formattedLines.push(line);
            }
        }
    }

    // Flush any remaining pending feature
    flushPendingFeature();

    // Close the last property container if we were in one
    if (inPropertyListing) {
        formattedLines.push('</div>');
    }

    return formattedLines.join('');
}



// NEW: Helper function to format contact information
function formatContactInfo(value, icon) {
    value = value.trim();
    
    if (icon === '📧') {
        // Format email - make it clickable
        if (value.includes('@')) {
            return `<a href="mailto:${value}" class="contact-link email-link">${value}</a>`;
        }
    } else if (icon === '📞' || icon === '📱') {
        // Format phone - make it clickable and clean up formatting
        const cleanPhone = value.replace(/[^\d+\-\s()]/g, '');
        return `<a href="tel:${cleanPhone.replace(/[^\d+]/g, '')}" class="contact-link phone-link">${cleanPhone}</a>`;
    }
    
    // Return original value if no special formatting needed
    return value;
}




// Convert Google Drive share URL to direct image URL
function convertGoogleDriveUrl(url) {
    // Handle different Google Drive URL formats
    if (url.includes('drive.google.com')) {
        // Extract file ID from various Google Drive URL formats
        let fileId = null;
        
        // Format: https://drive.google.com/file/d/FILE_ID/view
        let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
            fileId = match[1];
        }
        
        // Format: https://drive.google.com/open?id=FILE_ID
        if (!fileId) {
            match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (match) {
                fileId = match[1];
            }
        }
        
        // Format: https://drive.google.com/drive/folders/FOLDER_ID (extract ID from your format)
        if (!fileId) {
            match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
            if (match) {
                fileId = match[1];
            }
        }
        
        // Convert to direct view URL if we found an ID
        if (fileId) {
            return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
    }
    
    // If not a Google Drive URL or couldn't extract ID, return original
    return url;
}


// Open image in modal for full view - FIXED VERSION
function openImageModal(imageUrl, title = 'Property Image') {
    console.log('🖼️ Opening image modal:', imageUrl);
    
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalLoading = document.getElementById('modalLoading');
    
    if (!modal || !modalImage || !modalTitle || !modalLoading) {
        console.error('Modal elements not found');
        return;
    }
    
    modalTitle.textContent = title;
    modalImage.style.display = 'none';
    modalLoading.style.display = 'flex';
    modal.style.display = 'flex';
    
    // Load the image
    modalImage.onload = function() {
        modalLoading.style.display = 'none';
        modalImage.style.display = 'block';
        console.log('✅ Image loaded successfully in modal');
    };
    
    modalImage.onerror = function() {
        modalLoading.innerHTML = '<span style="color: #ff6b6b;">❌ Failed to load image</span>';
        console.error('❌ Failed to load image:', imageUrl);
    };
    
    modalImage.src = imageUrl;
}


// Close image modal - FIXED VERSION
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Download current image
function downloadImage() {
    const modal = document.getElementById('imageModal');
    const img = modal.querySelector('.modal-image');
    const url = img.src;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-image-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Make modal functions global
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.downloadImage = downloadImage;

function updateResponse(content, isError = false) {
    const responseDiv = document.getElementById('response');
    if (!responseDiv) return;
    
    // SAFETY CHECK: Don't display binary data as text
    if (typeof content === 'object' && content instanceof ArrayBuffer) {
        console.log('⚠️ Prevented binary data from being displayed as text');
        return;
    }
    
    if (isError) {
        responseDiv.innerHTML = `<div class="error-message">❌ <strong>Error:</strong><br>${content}</div>`;
    } else if (typeof content === 'object') {
        // Check if it's an audio response from n8n
        if (content && content.type === 'audio' && content.audioData) {
            displayAudioResponse(content, responseDiv);
        } else if (content && content.response) {
            // Format and display the actual text response from n8n
            const formattedResponse = formatPropertyText(content.response);
            responseDiv.innerHTML = `<div class="success-message">✅ <strong>Response:</strong></div><div class="formatted-content">${formattedResponse}</div>`;
        } else {
            responseDiv.innerHTML = `<pre>${JSON.stringify(content, null, 2)}</pre>`;
        }
    } else {
        // Format regular text content
        const formattedContent = formatPropertyText(content);
        responseDiv.innerHTML = `<div class="success-message">✅ <strong>Response:</strong></div><div class="formatted-content">${formattedContent}</div>`;
    }
    
    // Scroll to show the response
    responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Display audio response with player
function displayAudioResponse(audioData, responseDiv) {
    try {
        console.log('🎵 Creating audio player for response');
        
        // Create container for audio response
        const audioContainer = document.createElement('div');
        audioContainer.style.marginTop = '10px';
        audioContainer.style.padding = '15px';
        audioContainer.style.border = '2px solid #10b981';
        audioContainer.style.borderRadius = '8px';
        audioContainer.style.backgroundColor = '#f0fdf4';
        
        // Add title
        const title = document.createElement('div');
        title.innerHTML = '<strong>🎵 Voice Response:</strong>';
        title.style.marginBottom = '10px';
        title.style.color = '#059669';
        audioContainer.appendChild(title);
        
        // Create audio element
        const audioElement = document.createElement('audio');
        audioElement.controls = true;
        audioElement.style.width = '100%';
        audioElement.style.marginBottom = '10px';
        
        // Convert base64 to blob and create URL
        const mimeType = audioData.mimeType || 'audio/mpeg';
        const byteCharacters = atob(audioData.audioData);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        audioElement.src = audioUrl;
        audioContainer.appendChild(audioElement);
        
        // Add play button as backup
        const playButton = document.createElement('button');
        playButton.textContent = '▶️ Play Audio Response';
        playButton.style.padding = '8px 16px';
        playButton.style.backgroundColor = '#10b981';
        playButton.style.color = 'white';
        playButton.style.border = 'none';
        playButton.style.borderRadius = '4px';
        playButton.style.cursor = 'pointer';
        playButton.style.marginRight = '10px';
        
        playButton.onclick = () => {
            audioElement.play().catch(e => {
                console.error('Error playing audio:', e);
                updateStatus('Error playing audio', 'error');
            });
        };
        
        // Add download button
        const downloadButton = document.createElement('button');
        downloadButton.textContent = '💾 Download Audio';
        downloadButton.style.padding = '8px 16px';
        downloadButton.style.backgroundColor = '#059669';
        downloadButton.style.color = 'white';
        downloadButton.style.border = 'none';
        downloadButton.style.borderRadius = '4px';
        downloadButton.style.cursor = 'pointer';
        
        downloadButton.onclick = () => {
            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = `voice-response-${Date.now()}.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
        
        const buttonContainer = document.createElement('div');
        buttonContainer.appendChild(playButton);
        buttonContainer.appendChild(downloadButton);
        audioContainer.appendChild(buttonContainer);
        
        // Clear previous content and add audio player
        responseDiv.innerHTML = '';
        responseDiv.appendChild(audioContainer);
        
        // Auto-play after a short delay (if browser allows)
        setTimeout(() => {
            audioElement.play().catch(e => {
                console.log('Auto-play prevented by browser - manual play required');
            });
        }, 500);
        
        console.log('✅ Audio player created successfully');
        
    } catch (error) {
        console.error('❌ Error creating audio player:', error);
        responseDiv.innerHTML = `<div style="color: #ff6b6b;"><strong>❌ Error:</strong><br>Audio response received but could not create player: ${error.message}</div>`;
    }
}

// Send text message
async function sendTextMessage() {
    const messageInput = document.querySelector('input[type="text"]');
    const sendButton = document.querySelector('button[onclick="sendMessage()"]');
    
    if (!messageInput || !sendButton) return;
    
    const message = messageInput.value.trim();
    if (!message) return;

    try {
        console.log('📤 Sending text message:', message);
        updateStatus('Sending message...', 'processing');
        
        // Disable input and button
        messageInput.disabled = true;
        sendButton.disabled = true;
        sendButton.textContent = 'Sending...';

        const response = await fetch('/api/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                sessionId: currentSessionId
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Text message sent successfully:', result);
            updateStatus('Message sent', '');
            
            // Display the response from n8n
            if (result.response && result.response !== "") {
                updateResponse(result);
            } else {
                updateResponse('Message sent successfully to n8n workflow');
            }
            
            // Clear the input
            messageInput.value = '';
        } else {
            console.error('❌ Error sending message:', result);
            updateStatus('Send failed', 'error');
            updateResponse(result.error || 'Failed to send message', true);
        }

    } catch (error) {
        console.error('❌ Network error:', error);
        updateStatus('Network error', 'error');
        updateResponse(`Network error: ${error.message}`, true);
    } finally {
        // Re-enable input and button
        if (messageInput) {
            messageInput.disabled = false;
            messageInput.focus();
        }
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.textContent = 'Send';
        }
    }
}

// Make sendMessage available globally for inline onclick
window.sendMessage = sendTextMessage;

// Handle Enter key in text input
document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.querySelector('input[type="text"]');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendTextMessage();
            }
        });
    }
});

// Initialize the app
function initializeApp() {
    const sessionIdElement = document.getElementById('sessionId');
    if (sessionIdElement) {
        sessionIdElement.textContent = currentSessionId;
    }
    updateStatus('Ready');
    
    // Add sound toggle functionality
    const soundToggle = document.getElementById('sound-toggle');
    const bgVideo = document.getElementById('bg-video');

    if (soundToggle && bgVideo) {
        soundToggle.addEventListener('click', function() {
            if (bgVideo.muted) {
                bgVideo.muted = false;
                bgVideo.volume = 0.3; // Set to 30% volume
                soundToggle.textContent = '🔇 Disable Sound';
            } else {
                bgVideo.muted = true;
                soundToggle.textContent = '🔊 Enable Sound';
            }
        });
    }
    
    // Check if browser supports media recording
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        updateResponse('Your browser does not support voice recording. Please use a modern browser like Chrome, Firefox, or Edge.', true);
        updateStatus('Browser not supported', 'error');
        return;
    }

    setupEventListeners();
    performHealthCheck();
}

// Setup event listeners
function setupEventListeners() {
    const recordBtn = document.getElementById('recordBtn');
    const healthCheckBtn = document.getElementById('healthCheck');

    if (recordBtn) {
        recordBtn.addEventListener('click', toggleRecording);
    }

    // Diagnostic buttons
    if (healthCheckBtn) healthCheckBtn.addEventListener('click', performHealthCheck);
}

// Toggle recording function (click to start/stop instead of hold)
function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

// Start recording
async function startRecording() {
    if (isRecording) return;

    try {
        console.log('🎤 Starting recording...');
        updateStatus('Requesting microphone access...', 'processing');

        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });

        console.log('✅ Microphone access granted');
        updateStatus('Recording...', 'recording');

        // Update UI
        const recordBtn = document.getElementById('recordBtn');
        const recordingIndicator = document.getElementById('recordingIndicator');
        
        if (recordBtn) {
            recordBtn.classList.add('recording');
            recordBtn.textContent = '⏹️';
            recordBtn.title = 'Click to stop recording';
        }
        if (recordingIndicator) {
            recordingIndicator.classList.add('active');
        }

        // Setup MediaRecorder
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            console.log('🛑 Recording stopped');
            stream.getTracks().forEach(track => track.stop());
            
            if (audioChunks.length > 0) {
                await processRecording();
            }
        };

        mediaRecorder.start();
        isRecording = true;

    } catch (error) {
        console.error('❌ Recording error:', error);
        updateStatus('Recording failed', 'error');
        updateResponse(`Microphone error: ${error.message}`, true);
        resetRecordingUI();
    }
}

// Stop recording
function stopRecording() {
    if (!isRecording || !mediaRecorder) return;

    console.log('🛑 Stopping recording...');
    isRecording = false;
    
    if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    
    updateStatus('Processing...', 'processing');
    resetRecordingUI();
}

// Reset recording UI
function resetRecordingUI() {
    const recordBtn = document.getElementById('recordBtn');
    const recordingIndicator = document.getElementById('recordingIndicator');
    
    if (recordBtn) {
        recordBtn.classList.remove('recording');
        recordBtn.textContent = '🎤';
        recordBtn.title = 'Click to start recording';
    }
    if (recordingIndicator) {
        recordingIndicator.classList.remove('active');
    }
}

// Process recording
async function processRecording() {
    try {
        console.log('🔄 Processing recording...');
        
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log(`📁 Audio blob size: ${Math.round(audioBlob.size / 1024)}KB`);

        if (audioBlob.size < 1000) {
            throw new Error('Recording too short or empty');
        }

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('timestamp', new Date().toISOString());

        console.log('📤 Uploading voice to server...');
        updateStatus('Uploading voice...', 'processing');

        const response = await fetch(`/upload-voice?sessionId=${currentSessionId}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || "Upload failed");
        }

        console.log('📨 Received audio response from server');
        console.log('Response headers:', response.headers.get('content-type'));
        
        const responseAudioBlob = await response.blob();
        console.log(`🎵 Audio response blob size: ${Math.round(responseAudioBlob.size / 1024)}KB`);
        console.log('Audio blob type:', responseAudioBlob.type);
        
        // Verify we got actual audio data
        if (responseAudioBlob.size < 100) {
            throw new Error('Received empty or invalid audio response');
        }
        
        const audioUrl = URL.createObjectURL(responseAudioBlob);
        console.log('Audio URL created:', audioUrl);

        // Create and display audio player in the response section
        displayVoiceResponse(audioUrl);

        console.log('✅ Voice response processed successfully');
        updateStatus('Voice processed', '');
    } catch (error) {
        console.error('❌ Processing error:', error);
        updateStatus('Processing failed', 'error');
        updateResponse(`Processing error: ${error.message}`, true);
    }
}

// Display voice response with audio player
function displayVoiceResponse(audioUrl) {
    const responseDiv = document.getElementById('response');
    if (!responseDiv) return;
    
    try {
        // Create container for audio response
        const audioContainer = document.createElement('div');
        audioContainer.style.marginTop = '10px';
        audioContainer.style.padding = '15px';
        audioContainer.style.border = '2px solid #10b981';
        audioContainer.style.borderRadius = '8px';
        audioContainer.style.backgroundColor = '#f0fdf4';
        
        // Add title
        const title = document.createElement('div');
        title.innerHTML = '<strong>🎵 Voice Response:</strong>';
        title.style.marginBottom = '10px';
        title.style.color = '#059669';
        audioContainer.appendChild(title);
        
        // Create audio element with controls
        const audioElement = document.createElement('audio');
        audioElement.controls = true;
        audioElement.style.width = '100%';
        audioElement.style.marginBottom = '10px';
        audioElement.src = audioUrl;
        audioContainer.appendChild(audioElement);
        
        // Add control buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        
        // Play button
        const playButton = document.createElement('button');
        playButton.textContent = '▶️ Play Audio';
        playButton.style.padding = '8px 16px';
        playButton.style.backgroundColor = '#10b981';
        playButton.style.color = 'white';
        playButton.style.border = 'none';
        playButton.style.borderRadius = '4px';
        playButton.style.cursor = 'pointer';
        
        playButton.onclick = () => {
            audioElement.play().catch(e => {
                console.error('Error playing audio:', e);
                updateStatus('Error playing audio', 'error');
            });
        };
        
        // Download button
        const downloadButton = document.createElement('button');
        downloadButton.textContent = '💾 Download';
        downloadButton.style.padding = '8px 16px';
        downloadButton.style.backgroundColor = '#059669';
        downloadButton.style.color = 'white';
        downloadButton.style.border = 'none';
        downloadButton.style.borderRadius = '4px';
        downloadButton.style.cursor = 'pointer';
        
        downloadButton.onclick = () => {
            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = `voice-response-${Date.now()}.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
        
        buttonContainer.appendChild(playButton);
        buttonContainer.appendChild(downloadButton);
        audioContainer.appendChild(buttonContainer);
        
        // Clear previous content and add audio player
        responseDiv.innerHTML = '';
        responseDiv.appendChild(audioContainer);
        
        console.log('✅ Voice response UI created successfully');
        
    } catch (error) {
        console.error('❌ Error creating voice response UI:', error);
        updateResponse(`Voice response received but could not create player: ${error.message}`, true);
    }
}

// Health check function with proper error handling
async function performHealthCheck() {
    try {
        updateStatus('Running health check...', 'processing');
        
        const response = await fetch('/health');
        
        // Check if response is ok first
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Check content type before parsing JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Expected JSON but got: ${contentType}. Response: ${text.substring(0, 100)}...`);
        }
        
        const result = await response.json();

        console.log('✅ Health check passed:', result);
        updateStatus('System healthy', '');
        updateResponse(`✅ API Good, Status Good - System is running properly`);
        
    } catch (error) {
        console.error('❌ Health check error:', error);
        updateStatus('Health check failed', 'error');
        updateResponse(`Health check error: ${error.message}`, true);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeApp);