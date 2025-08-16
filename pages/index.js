// pages/index.js
import Head from "next/head";
import Script from "next/script";

export default function Home() {
  return (
    <>
      {/* HEAD */}
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>🏠 DME Real Estate Assistant</title>
        <meta name="description" content="AI-powered real estate assistant with voice recording and property search capabilities" />
        <meta name="keywords" content="real estate, AI assistant, property search, voice recording" />
        <meta name="author" content="DME Real Estate" />

        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@100;200;300;400;500;600;700;800;900&family=Kalam:wght@300;400;700&family=Federant&family=Noto+Sans+Arabic:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* Stylesheet */}
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      {/* BODY */}

      {/* Background video */}
      <video autoPlay muted loop id="bg-video" playsInline>
        <source src="/video.mp4" type="video/mp4" />
        <p>Your browser does not support the video tag.</p>
      </video>

      {/* Sound toggle button */}
      <button id="sound-toggle" className="sound-toggle-btn" aria-label="Toggle background video sound">
        🔊 Enable Sound
      </button>

      <div className="container">
        <header>
          <h1 className="neon-text">🏠 DME Real Estate Assistant</h1>
          <p className="neon-text-sub">Your AI-powered real estate companion</p>
        </header>

        <div className="session-info">
          <span className="neon-text-small">
            Session ID: <code id="sessionId">Loading...</code>
          </span>
          <div className="status neon-text-small" id="status">
            Ready
          </div>
        </div>

        {/* Input controls */}
        <div className="input-controls">
          <h3 className="neon-text-sub">💬 Send Message or 🎤 Record Voice</h3>
          <div className="input-group">
            <input
              type="text"
              id="textInput"
              className="neon-input"
              placeholder="Type your real estate question here..."
              maxLength="500"
              aria-label="Text input for real estate questions"
            />
            <button
              id="sendButton"
              className="neon-button"
              aria-label="Send text message"
            >
              Send
            </button>
            <button 
              id="recordBtn" 
              className="record-btn neon-button" 
              aria-label="Record voice message"
              title="Click to start/stop recording"
            >
              🎤
            </button>
            <div className="recording-indicator" id="recordingIndicator">
              <div className="pulse-dot"></div>
              <span className="neon-text-small">Recording...</span>
            </div>
          </div>
        </div>

        {/* Response section */}
        <div className="response-section">
          <h3 className="neon-text-sub">📋 Assistant Response:</h3>
          <div id="response" className="response-box" role="log" aria-live="polite">
            <p className="placeholder neon-text-small">
              Welcome! Send a text message or click the microphone to record your real estate question...
            </p>
          </div>
        </div>

        {/* Diagnostics */}
        <div className="diagnostics">
          <button id="healthCheck" className="neon-button" aria-label="Run system health check">
            🔍 System Health Check
          </button>
        </div>

        {/* Instructions */}
        <div className="instructions">
          <h4 className="neon-text-sub">Quick Guide:</h4>
          <ul>
            <li className="neon-text-small">
              💬 <strong>Text:</strong> Type your question and click Send (or press Enter)
            </li>
            <li className="neon-text-small">
              🎤 <strong>Voice:</strong> Click microphone to start/stop recording
            </li>
            <li className="neon-text-small">
              🔍 <strong>Diagnostics:</strong> Use Health Check if experiencing issues
            </li>
            <li className="neon-text-small">
              📱 <strong>Mobile:</strong> Optimized for all devices and screen sizes
            </li>
          </ul>
        </div>
      </div>

      {/* Image Modal */}
      <div id="imageModal" className="image-modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div
          className="modal-backdrop"
          id="modalBackdrop"
          aria-label="Close modal"
        ></div>
        <div className="modal-content">
          <div className="modal-header">
            <h3 id="modalTitle" className="neon-text-sub">
              Property Image
            </h3>
            <button
              className="modal-close neon-button"
              id="modalClose"
              aria-label="Close image modal"
            >
              &times;
            </button>
          </div>
          <div className="modal-body">
            <div className="modal-loading" id="modalLoading">
              <div className="loading-spinner" aria-label="Loading"></div>
              <span className="neon-text-small">Loading image...</span>
            </div>
            <img
              id="modalImage"
              className="modal-image"
              style={{ display: "none" }}
              alt="Property image in full size"
            />
          </div>
        </div>
      </div>

      {/* External app.js - Load after interactive */}
        <Script 
        src="/app.js" 
        strategy="afterInteractive"
        onLoad={() => {
            console.log('App.js loaded, initializing...');
            // Force initialization after a small delay to ensure DOM is ready
            setTimeout(() => {
            if (typeof window.initializeApp === 'function') {
                window.initializeApp();
            }
            }, 100);
        }}
        />

      {/* Enhanced Arabic detection and RTL support script */}
      <Script id="arabic-detection" strategy="afterInteractive">
        {`
          function detectAndSetArabic() {
            const responseBox = document.getElementById('response');
            // Enhanced Arabic detection regex including additional Arabic script ranges
            const arabicRegex = /[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]/;
            
            if (responseBox && responseBox.textContent) {
              const hasArabic = arabicRegex.test(responseBox.textContent);
              
              if (hasArabic) {
                responseBox.classList.add('rtl-content');
                responseBox.setAttribute('dir', 'rtl');
                responseBox.setAttribute('lang', 'ar');
                
                // Apply RTL to child elements containing Arabic text
                const childElements = responseBox.querySelectorAll('p, div, span, li');
                childElements.forEach(element => {
                  if (arabicRegex.test(element.textContent)) {
                    element.classList.add('rtl-content');
                    element.setAttribute('dir', 'rtl');
                    element.setAttribute('lang', 'ar');
                  }
                });
                
                // Special handling for property features
                const propertyFeatures = responseBox.querySelectorAll('.property-feature');
                propertyFeatures.forEach(feature => {
                  if (arabicRegex.test(feature.textContent)) {
                    feature.setAttribute('lang', 'ar');
                  }
                });
                
                console.log('✅ Arabic text detected and RTL applied');
              } else {
                // Remove RTL classes and attributes for non-Arabic content
                responseBox.classList.remove('rtl-content');
                responseBox.removeAttribute('dir');
                responseBox.removeAttribute('lang');
                
                // Remove from child elements
                const childElements = responseBox.querySelectorAll('[lang="ar"]');
                childElements.forEach(element => {
                  element.classList.remove('rtl-content');
                  element.removeAttribute('dir');
                  element.removeAttribute('lang');
                });
              }
            }
          }
          
          // Create observer for dynamic content changes
          const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
              if (mutation.type === 'childList' || mutation.type === 'characterData') {
                // Debounce the detection to avoid excessive calls
                clearTimeout(window.arabicDetectionTimeout);
                window.arabicDetectionTimeout = setTimeout(detectAndSetArabic, 100);
              }
            });
          });
          
          // Initialize when DOM is ready
          document.addEventListener('DOMContentLoaded', function() {
            const responseBox = document.getElementById('response');
            if (responseBox) {
              // Start observing
              observer.observe(responseBox, {
                childList: true,
                subtree: true,
                characterData: true
              });
              
              // Initial detection
              detectAndSetArabic();
              console.log('✅ Arabic detection system initialized');
            }
          });
          
          // Export function for manual calls if needed
          window.detectAndSetArabic = detectAndSetArabic;
        `}
      </Script>

      {/* Performance and accessibility enhancements */}
      <Script id="app-enhancements" strategy="afterInteractive">
        {`
          document.addEventListener('DOMContentLoaded', function() {
            // Preload important elements
            const video = document.getElementById('bg-video');
            if (video) {
              // Optimize video loading
              video.addEventListener('loadstart', () => console.log('🎥 Background video loading started'));
              video.addEventListener('canplay', () => console.log('✅ Background video ready'));
              video.addEventListener('error', (e) => console.error('❌ Video loading error:', e));
            }
            
            // Keyboard shortcuts
            document.addEventListener('keydown', function(e) {
              // Global shortcuts
              if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                  case 'Enter':
                    e.preventDefault();
                    if (typeof window.sendMessage === 'function') {
                      window.sendMessage();
                    }
                    break;
                  case '/':
                    e.preventDefault();
                    const textInput = document.getElementById('textInput');
                    if (textInput) {
                      textInput.focus();
                    }
                    break;
                }
              }
              
              // ESC key handlers
              if (e.key === 'Escape') {
                // Close modal if open
                if (typeof window.closeImageModal === 'function') {
                  window.closeImageModal();
                }
                
                // Clear focus from inputs
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                  activeElement.blur();
                }
              }
            });
            
            // Enhanced error handling for media permissions
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              // Check for media permissions on load
              navigator.permissions.query({ name: 'microphone' }).then(function(result) {
                console.log('🎤 Microphone permission status:', result.state);
                
                result.addEventListener('change', function() {
                  console.log('🎤 Microphone permission changed to:', this.state);
                });
              }).catch(function(error) {
                console.log('⚠️ Could not query microphone permissions:', error);
              });
            }
            
            // Service Worker registration for offline support (optional)
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').then(function(registration) {
                console.log('✅ ServiceWorker registered:', registration.scope);
              }).catch(function(error) {
                console.log('⚠️ ServiceWorker registration failed:', error);
              });
            }
            
            // Performance monitoring
            if ('performance' in window) {
              window.addEventListener('load', function() {
                setTimeout(function() {
                  const perfData = performance.timing;
                  const loadTime = perfData.loadEventEnd - perfData.navigationStart;
                  console.log('⚡ Page load time:', loadTime + 'ms');
                }, 0);
              });
            }
            
            // Connection status monitoring
            function updateOnlineStatus() {
              const status = document.getElementById('status');
              if (navigator.onLine) {
                console.log('🌐 Connection: Online');
              } else {
                console.log('📴 Connection: Offline');
                if (status && typeof updateStatus === 'function') {
                  updateStatus('Offline', 'error');
                }
              }
            }
            
            window.addEventListener('online', updateOnlineStatus);
            window.addEventListener('offline', updateOnlineStatus);
            updateOnlineStatus(); // Check initial status
            
            console.log('✅ App enhancements initialized');
          });
        `}
      </Script>
    </>
  );
}
