// Global variables
let currentSessionId = generateSessionId();
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

function generateSessionId() {
    return `DME-agent--@copyrights-${crypto.randomUUID()}`;
}

// Update UI elements
function updateStatus(message, className = '') {
    const status = document.getElementById('status');
    if (status) {
        status.textContent = message;
        status.className = `status neon-text-small ${className}`;
    }
}

// Enhanced function to format property listings with improved multi-line feature handling
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
        value = value.trim();
        
        if (icon === '📧') {
            if (value.includes('@')) {
                return `<a href="mailto:${value}" class="contact-link email-link">${value}</a>`;
            }
        } else if (icon === '📞' || icon === '📱') {
            const cleanPhone = value.replace(/[^\d+\-\s()]/g, '');
            const telNumber = cleanPhone.replace(/[^\d+]/g, '');
            return `<a href="tel:${telNumber}" class="contact-link phone-link">${cleanPhone}</a>`;
        }
        
        return value;
    }

    // Helper function to convert Google Drive URLs to direct image URLs
    function convertGoogleDriveUrl(url) {
        if (url.includes('drive.google.com')) {
            let fileId = null;
            
            // Extract file ID from various Google Drive URL formats
            let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (match) {
                fileId = match[1];
            } else {
                match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                if (match) {
                    fileId = match[1];
                }
            }
            
            if (fileId) {
                return `https://drive.google.com/uc?export=view&id=${fileId}`;
            }
        }
        
        return url;
    }

    // First, handle markdown-style bold formatting
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
            if (currentFeatureContainer) {
                pendingFeatureContent.push('');
            } else {
                flushPendingFeature();
                formattedLines.push('<br>');
            }
            continue;
        }

        // Check for markdown headers
        if (line.startsWith('### ')) {
            flushPendingFeature();
            
            if (inPropertyListing) {
                formattedLines.push('</div>');
            }
            
            formattedLines.push(`<div class="property-item">`);
            formattedLines.push(`<div class="property-header">🏠 ${line.replace('### ', '')}</div>`);
            inPropertyListing = true;
            continue;
        }

        // Check for numbered property listings
        if (/^\d+\.\s/.test(line)) {
            flushPendingFeature();
            
            if (inPropertyListing) {
                formattedLines.push('</div>');
            }
            
            formattedLines.push(`<div class="property-item">`);
            formattedLines.push(`<div class="property-header">🏠 Property Details</div>`);
            inPropertyListing = true;
            
            line = line.replace(/^\d+\.\s*/, '');
            if (!line) continue;
        }

        // Handle bullet points
        if (line.startsWith('- ') && inPropertyListing) {
            const content = line.substring(2).trim();
            const colonIndex = content.indexOf(':');
            
            if (colonIndex > 0) {
                flushPendingFeature();
                
                const featureName = content.substring(0, colonIndex).trim().toLowerCase();
                const featureValue = content.substring(colonIndex + 1).trim();
                
                let icon = '🏷️';
                for (const [feature, featureIcon] of Object.entries(featureIcons)) {
                    if (featureName.includes(feature) || feature.includes(featureName)) {
                        icon = featureIcon;
                        break;
                    }
                }
                
                if (featureValue) {
                    const formattedValue = formatContactInfo(featureValue, icon);
                    const cssClass = (icon === '📧' || icon === '📞' || icon === '📱') ? 'property-feature contact-info' : 'property-feature';
                    line = `<div class="${cssClass}"><span class="feature-icon">${icon}</span><strong>${content.substring(0, colonIndex)}:</strong> ${formattedValue}</div>`;
                    formattedLines.push(line);
                    continue;
                } else {
                    const cssClass = (icon === '📧' || icon === '📞' || icon === '📱') ? 'property-feature contact-info' : 'property-feature';
                    currentFeatureContainer = `<div class="${cssClass}"><span class="feature-icon">${icon}</span><strong>${featureName}:</strong></div>`;
                    continue;
                }
            } else {
                if (currentFeatureContainer) {
                    pendingFeatureContent.push(`• ${content}`);
                    continue;
                } else {
                    line = `<div class="property-sub-item"><span class="feature-icon">•</span> ${content}</div>`;
                    formattedLines.push(line);
                    continue;
                }
            }
        }

        // Check for property features with bold formatting
        let isPropertyFeature = false;
        const boldMatch = line.match(/<strong>(.*?):\s*<\/strong>(.*)/i);
        
        if (boldMatch && inPropertyListing) {
            flushPendingFeature();
            
            const featureName = boldMatch[1].toLowerCase();
            const featureValue = boldMatch[2].trim();
            
            let icon = '🏷️';
            for (const [feature, featureIcon] of Object.entries(featureIcons)) {
                if (featureName.includes(feature) || feature.includes(featureName)) {
                    icon = featureIcon;
                    break;
                }
            }
            
            if (featureValue) {
                const formattedValue = formatContactInfo(featureValue, icon);
                const cssClass = (icon === '📧' || icon === '📞' || icon === '📱') ? 'property-feature contact-info' : 'property-feature';
                line = `<div class="${cssClass}"><span class="feature-icon">${icon}</span><strong>${boldMatch[1]}:</strong> ${formattedValue}</div>`;
                formattedLines.push(line);
            } else {
                const cssClass = (icon === '📧' || icon === '📞' || icon === '📱') ? 'property-feature contact-info' : 'property-feature';
                currentFeatureContainer = `<div class="${cssClass}"><span class="feature-icon">${icon}</span><strong>${boldMatch[1]}:</strong></div>`;
            }
            isPropertyFeature = true;
        } else {
            // Check for simple feature patterns
            for (const [feature, icon] of Object.entries(featureIcons)) {
                const simpleRegex = new RegExp(`^\\s*-?\\s*${feature}:\\s*`, 'i');
                if (simpleRegex.test(line)) {
                    flushPendingFeature();
                    
                    const value = line.replace(simpleRegex, '').trim();
                    
                    if (value) {
                        const formattedValue = formatContactInfo(value, icon);
                        const cssClass = (icon === '📧' || icon === '📞' || icon === '📱') ? 'property-feature contact-info' : 'property-feature';
                        line = `<div class="${cssClass}"><span class="feature-icon">${icon}</span><strong>${feature.charAt(0).toUpperCase() + feature.slice(1)}:</strong> ${formattedValue}</div>`;
                        formattedLines.push(line);
                    } else {
                        const cssClass = (icon === '📧' || icon === '📞' || icon === '📱') ? 'property-feature contact-info' : 'property-feature';
                        currentFeatureContainer = `<div class="${cssClass}"><span class="feature-icon">${icon}</span><strong>${feature.charAt(0).toUpperCase() + feature.slice(1)}:</strong></div>`;
                    }
                    isPropertyFeature = true;
                    break;
                }
            }
        }

        if (!isPropertyFeature) {
            // Handle image links
            if (line.includes('![Image')) {
                flushPendingFeature();
                
                line = line.replace(/!\[Image \d+\]\((.*?)\)/g, (match, url) => {
                    const directUrl = convertGoogleDriveUrl(url);
                    return `<div class="property-feature">
                        <span class="feature-icon">📸</span>
                        <div class="image-container">
                            <img src="${directUrl}" alt="Property Image" class="property-thumbnail" onclick="openImageModal('${directUrl}')" onerror="this.parentNode.innerHTML='<div class=\\"image-error\\">Image failed to load</div>'" />
                            <span class="image-label">Click to enlarge</span>
                        </div>
                    </div>`;
                });
                formattedLines.push(line);
            } else if (currentFeatureContainer) {
                pendingFeatureContent.push(line);
            } else {
                formattedLines.push(line);
            }
        }
    }

    flushPendingFeature();

    if (inPropertyListing) {
        formattedLines.push('</div>');
    }

    return formattedLines.join('');
}

// Image modal functions
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
    
    modalImage.onload = function() {
        modalLoading.style.display = 'none';
        modalImage.style.display = 'block';
        console.log('✅ Image loaded successfully in modal');
    };
    
    modalImage.onerror = function() {
        modalLoading.innerHTML = '<span class="neon-text-small" style="color: #ff6b6b;">❌ Failed to load image</span>';
        console.error('❌ Failed to load image:', imageUrl);
    };
    
    modalImage.src = imageUrl;
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function downloadImage() {
    const modal = document.getElementById('imageModal');
    const img = modal.querySelector('.modal-image');
    if (img && img.src) {
        const a = document.createElement('a');
        a.href = img.src;
        a.download = `property-image-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

// Update response display
function updateResponse(content, isError = false) {
    const responseDiv = document.getElementById('response');
    if (!responseDiv) return;
    
    if (typeof content === 'object' && content instanceof ArrayBuffer) {
        console.log('⚠️ Prevented binary data from being displayed as text');
        return;
    }
    
    if (isError) {
        responseDiv.innerHTML = `<div class="error-message">❌ <strong>Error:</strong><br>${content}</div>`;
    } else if (typeof content === 'object') {
        if (content && content.type === 'audio' && content.audioData) {
            displayAudioResponse(content, responseDiv);
        } else if (content && content.response) {
            const formattedResponse = formatPropertyText(content.response);
            responseDiv.innerHTML = `<div class="success-message">✅ <strong>Response:</strong></div><div class="formatted-content">${formattedResponse}</div>`;
        } else {
            responseDiv.innerHTML = `<pre class="neon-text-small">${JSON.stringify(content, null, 2)}</pre>`;
        }
    } else {
        const formattedContent = formatPropertyText(content);
        responseDiv.innerHTML = `<div class="success-message">✅ <strong>Response:</strong></div><div class="formatted-content">${formattedContent}</div>`;
    }
    
    responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Display audio response
function displayAudioResponse(audioData, responseDiv) {
    try {
        console.log('🎵 Creating audio player for response');
        
        const audioContainer = document.createElement('div');
        audioContainer.className = 'audio-container';
        
        const title = document.createElement('div');
        title.innerHTML = '<strong>🎵 Voice Response:</strong>';
        title.className = 'neon-text-sub';
        title.style.marginBottom = '10px';
        audioContainer.appendChild(title);
        
        const audioElement = document.createElement('audio');
        audioElement.controls = true;
        audioElement.className = 'neon-input';
        audioElement.style.width = '100%';
        audioElement.style.marginBottom = '10px';
        
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
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'audio-controls';
        
        const playButton = document.createElement('button');
        playButton.textContent = '▶️ Play Audio';
        playButton.className = 'neon-button audio-btn-primary';
        playButton.onclick = () => {
            audioElement.play().catch(e => {
                console.error('Error playing audio:', e);
                updateStatus('Error playing audio', 'error');
            });
        };
        
        const downloadButton = document.createElement('button');
        downloadButton.textContent = '💾 Download';
        downloadButton.className = 'neon-button audio-btn-secondary';
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
        
        responseDiv.innerHTML = '';
        responseDiv.appendChild(audioContainer);
        
        setTimeout(() => {
            audioElement.play().catch(e => {
                console.log('Auto-play prevented by browser - manual play required');
            });
        }, 500);
        
        console.log('✅ Audio player created successfully');
        
    } catch (error) {
        console.error('❌ Error creating audio player:', error);
        responseDiv.innerHTML = `<div class="error-message"><strong>❌ Error:</strong><br>Audio response received but could not create player: ${error.message}</div>`;
    }
}

// Send text message
async function sendTextMessage() {
    const messageInput = document.getElementById('textInput');
    const sendButton = document.getElementById('sendButton');
    
    if (!messageInput || !sendButton) return;
    
    const message = messageInput.value.trim();
    if (!message) return;

    try {
        console.log('📤 Sending text message:', message);
        updateStatus('Sending message...', 'processing');
        
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
            
            if (result.response && result.response !== "") {
                // Extract the bot message from the nested response
                const botResponse = result.response.bot || result.response;
                updateResponse(botResponse);
            } else {
                updateResponse('Message sent successfully to n8n workflow');
            }
                        
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

// Recording functions
function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

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

async function processRecording() {
    try {
        console.log('🔄 Processing recording...');
        
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log(`📁 Audio blob size: ${Math.round(audioBlob.size / 1024)}KB`);
        
        if (audioBlob.size < 1000) {
            throw new Error('Recording too short or empty');
        }

        console.log('📤 Uploading voice to server...');
        updateStatus('Uploading voice...', 'processing');

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('sessionId', currentSessionId);
        formData.append('timestamp', new Date().toISOString());

        const response = await fetch('/api/upload-voice', {
            method: 'POST',
            body: formData
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // Check if response is JSON or audio
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);

        if (contentType && contentType.includes('application/json')) {
            // Handle JSON response
            const result = await response.json();
            console.log('Parsed JSON result:', result);
            
            if (result.response && result.response.bot) {
                updateResponse(result.response.bot);
            } else if (result.response) {
                updateResponse(result.response);
            } else {
                updateResponse('Voice message processed successfully');
            }
            updateStatus('Voice processed', '');
        } else {
            // Handle audio response
            console.log('Received audio response');
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            displayVoiceResponse(audioUrl);
            updateStatus('Voice processed', '');
        }

    } catch (error) {
        console.error('❌ Processing error:', error);
        updateStatus('Processing failed', 'error');
        updateResponse(`Processing error: ${error.message}`, true);
    }
}
function displayVoiceResponse(audioUrl) {
    const responseDiv = document.getElementById('response');
    if (!responseDiv) return;
    
    try {
        const audioContainer = document.createElement('div');
        audioContainer.className = 'audio-container';
        
        const title = document.createElement('div');
        title.innerHTML = '<strong>🎵 Voice Response:</strong>';
        title.className = 'neon-text-sub';
        title.style.marginBottom = '10px';
        audioContainer.appendChild(title);
        
        const audioElement = document.createElement('audio');
        audioElement.controls = true;
        audioElement.className = 'neon-input';
        audioElement.style.width = '100%';
        audioElement.style.marginBottom = '10px';
        audioElement.src = audioUrl;
        audioContainer.appendChild(audioElement);
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'audio-controls';
        
        const playButton = document.createElement('button');
        playButton.textContent = '▶️ Play Audio';
        playButton.className = 'neon-button audio-btn-primary';
        playButton.onclick = () => {
            audioElement.play().catch(e => {
                console.error('Error playing audio:', e);
                updateStatus('Error playing audio', 'error');
            });
        };
        
        const downloadButton = document.createElement('button');
        downloadButton.textContent = '💾 Download';
        downloadButton.className = 'neon-button audio-btn-secondary';
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
        
        responseDiv.innerHTML = '';
        responseDiv.appendChild(audioContainer);
        
        console.log('✅ Voice response UI created successfully');
        
    } catch (error) {
        console.error('❌ Error creating voice response UI:', error);
        updateResponse(`Voice response received but could not create player: ${error.message}`, true);
    }
}

// Health check function
async function performHealthCheck() {
    try {
        updateStatus('Running health check...', 'processing');
        
        const response = await fetch("/api/health");
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
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

// Initialize the app
function initializeApp() {
    const sessionIdElement = document.getElementById('sessionId');
    if (sessionIdElement) {
        sessionIdElement.textContent = currentSessionId;
    }
    updateStatus('Ready');
    
    // Sound toggle functionality
    const soundToggle = document.getElementById('sound-toggle');
    const bgVideo = document.getElementById('bg-video');

    if (soundToggle && bgVideo) {
        soundToggle.addEventListener('click', function() {
            if (bgVideo.muted) {
                bgVideo.muted = false;
                bgVideo.volume = 0.3;
                soundToggle.textContent = '🔇 Disable Sound';
                soundToggle.classList.add('sound-enabled');
            } else {
                bgVideo.muted = true;
                soundToggle.textContent = '🔊 Enable Sound';
                soundToggle.classList.remove('sound-enabled');
            }
        });
    }
    
    // Check browser support
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
    const textInput = document.getElementById('textInput');
    const sendButton = document.getElementById('sendButton');
    const recordBtn = document.getElementById('recordBtn');
    const healthCheckBtn = document.getElementById('healthCheck');
    const modalClose = document.getElementById('modalClose');
    const modalBackdrop = document.getElementById('modalBackdrop');

    // Text input events
    if (textInput) {
        textInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendTextMessage();
            }
        });
    }

    // Button events
    if (sendButton) {
        sendButton.addEventListener('click', sendTextMessage);
    }

    if (recordBtn) {
        recordBtn.addEventListener('click', toggleRecording);
    }

    if (healthCheckBtn) {
        healthCheckBtn.addEventListener('click', performHealthCheck);
    }

    // Modal events
    if (modalClose) {
        modalClose.addEventListener('click', closeImageModal);
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeImageModal);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // ESC to close modal
        if (e.key === 'Escape') {
            closeImageModal();
        }
        
        // Ctrl/Cmd + Enter to send message
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            sendTextMessage();
        }
    });
}

// Make functions globally available
window.sendMessage = sendTextMessage;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.downloadImage = downloadImage;

// Make initializeApp globally available
window.initializeApp = initializeApp;

// Multiple initialization attempts to ensure it works
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded, initializing app...');
    initializeApp();
    
    // Arabic text detection setup
    const responseBox = document.getElementById('response');
    if (responseBox) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    detectAndSetArabic();
                }
            });
        });
        
        observer.observe(responseBox, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        detectAndSetArabic();
    }
});

// Fallback initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already ready
    setTimeout(initializeApp, 50);
}

// Additional fallback for Next.js
window.addEventListener('load', function() {
    setTimeout(initializeApp, 100);
});

// Arabic text detection function
function detectAndSetArabic() {
    const responseBox = document.getElementById('response');
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    
    if (responseBox && responseBox.textContent) {
        const hasArabic = arabicRegex.test(responseBox.textContent);
        if (hasArabic) {
            responseBox.classList.add('rtl-content');
            responseBox.setAttribute('dir', 'rtl');
            responseBox.setAttribute('lang', 'ar');
            
            const childElements = responseBox.querySelectorAll('p, div, span');
            childElements.forEach(element => {
                if (arabicRegex.test(element.textContent)) {
                    element.classList.add('rtl-content');
                    element.setAttribute('dir', 'rtl');
                    element.setAttribute('lang', 'ar');
                }
            });
        } else {
            responseBox.classList.remove('rtl-content');
            responseBox.removeAttribute('dir');
            responseBox.removeAttribute('lang');
        }
    }
}
