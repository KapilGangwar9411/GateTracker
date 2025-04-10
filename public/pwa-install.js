// PWA Installation Helper
let deferredPrompt;
let installContainer;
let welcomePopup;

document.addEventListener('DOMContentLoaded', () => {
  try {
    // Create button element
    const installButton = document.createElement('div');
    installButton.style.display = 'none';
    installButton.classList.add('pwa-install-icon');
    
    // Create a container for the install button and the curved text
    installContainer = document.createElement('div');
    installContainer.classList.add('pwa-install-container');
    
    // Create a welcome popup for first-time users
    welcomePopup = document.createElement('div');
    welcomePopup.classList.add('pwa-welcome-popup');
    welcomePopup.innerHTML = `
      <div class="pwa-welcome-popup-content">
        <div class="pwa-popup-header">
          <div class="pwa-popup-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0H5m14 0l-2-7H7l-2 7m14 0h-2.5M5 21h2.5"></path>
              <path d="M12 12V8m0 4v4m-4-4h8"></path>
            </svg>
          </div>
          <h3>Install GATE Prep Tracker</h3>
          <button class="pwa-popup-close">×</button>
        </div>
        <div class="pwa-popup-body">
          <p>Install our app on your PC for:</p>
          <ul>
            <li><span class="pwa-check">✓</span> Faster access to your study materials</li>
            <li><span class="pwa-check">✓</span> Offline capabilities</li>
            <li><span class="pwa-check">✓</span> Better performance & experience</li>
          </ul>
          <div class="pwa-popup-devices">
            <div class="pwa-device-icon">💻</div>
            <div class="pwa-device-icon">📱</div>
          </div>
        </div>
        <div class="pwa-popup-footer">
          <button class="pwa-install-btn">Install Now</button>
          <button class="pwa-later-btn">Maybe Later</button>
        </div>
      </div>
    `;
    
    // Add the button icon
    installButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
    `;
    
    // Create curved text element
    const curvedText = document.createElement('div');
    curvedText.classList.add('curved-text');
    curvedText.textContent = 'Install App';
    
    // Add pulse animation element
    const pulseRing = document.createElement('div');
    pulseRing.classList.add('pulse-ring');
    
    // Append elements to container
    installContainer.appendChild(curvedText);
    installContainer.appendChild(installButton);
    installButton.appendChild(pulseRing);
    document.body.appendChild(installContainer);
    document.body.appendChild(welcomePopup);
    
    // Style the container
    installContainer.style.position = 'fixed';
    installContainer.style.bottom = '20px';
    installContainer.style.right = '20px';
    installContainer.style.zIndex = '9999';
    installContainer.style.display = 'none';  // Initialize as hidden
    installContainer.style.flexDirection = 'column';
    installContainer.style.alignItems = 'center';
    installContainer.style.width = '80px';
    
    // Style the icon - make it more prominent
    installButton.style.backgroundColor = 'rgba(79, 70, 229, 0.9)';
    installButton.style.color = 'white';
    installButton.style.width = '48px';
    installButton.style.height = '48px';
    installButton.style.borderRadius = '50%';
    installButton.style.border = 'none';
    installButton.style.display = 'flex';
    installButton.style.alignItems = 'center';
    installButton.style.justifyContent = 'center';
    installButton.style.boxShadow = '0 4px 10px rgba(79, 70, 229, 0.3)';
    installButton.style.cursor = 'pointer';
    installButton.style.transition = 'all 0.3s ease';
    installButton.style.position = 'relative';
    installButton.style.overflow = 'visible';
    
    // Add all styles for both install button and welcome popup
    const style = document.createElement('style');
    style.textContent = `
      .pwa-install-container {
        transform: scale(0.95);
        transition: transform 0.3s ease;
        animation: bounce 1s ease 2s 3;
      }
      
      .pwa-install-container:hover {
        transform: scale(1.05);
      }
      
      .pulse-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: rgba(79, 70, 229, 0.4);
        z-index: -1;
        pointer-events: none;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 0.6;
        }
        70% {
          transform: scale(1.3);
          opacity: 0;
        }
        100% {
          transform: scale(1.3);
          opacity: 0;
        }
      }
      
      @keyframes bounce {
        0%, 100% { transform: scale(0.95); }
        50% { transform: scale(1.05); }
      }
      
      .pwa-install-icon {
        position: relative;
        margin-top: 8px;
        z-index: 1;
      }
      
      .pwa-install-icon:hover {
        transform: scale(1.1);
      }
      
      .curved-text {
        font-size: 12px;
        font-family: sans-serif;
        color: #4f46e5;
        text-align: center;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 12px;
        background-color: rgba(79, 70, 229, 0.1);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        white-space: nowrap;
        letter-spacing: 0.5px;
      }
      
      /* Welcome Popup Styles */
      .pwa-welcome-popup {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.5s ease;
      }
      
      .pwa-welcome-popup.visible {
        display: flex;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .pwa-welcome-popup-content {
        width: 90%;
        max-width: 400px;
        background-color: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      
      @keyframes slideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .pwa-popup-header {
        padding: 16px;
        background-color: #4f46e5;
        color: white;
        display: flex;
        align-items: center;
        position: relative;
      }
      
      .pwa-popup-logo {
        width: 40px;
        height: 40px;
        background-color: white;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        color: #4f46e5;
      }
      
      .pwa-popup-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        flex-grow: 1;
      }
      
      .pwa-popup-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.3s;
      }
      
      .pwa-popup-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .pwa-popup-body {
        padding: 20px;
      }
      
      .pwa-popup-body p {
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 16px;
        color: #4b5563;
      }
      
      .pwa-popup-body ul {
        list-style: none;
        padding: 0;
        margin: 0 0 20px 0;
      }
      
      .pwa-popup-body li {
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        font-size: 14px;
        color: #4b5563;
      }
      
      .pwa-check {
        color: #22c55e;
        font-weight: bold;
        margin-right: 8px;
        font-size: 16px;
      }
      
      .pwa-popup-devices {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin: 20px 0;
      }
      
      .pwa-device-icon {
        font-size: 24px;
        animation: floatDevice 3s ease-in-out infinite;
      }
      
      .pwa-device-icon:nth-child(2) {
        animation-delay: 0.5s;
      }
      
      @keyframes floatDevice {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      .pwa-popup-footer {
        padding: 16px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        border-top: 1px solid #e5e7eb;
      }
      
      .pwa-install-btn, .pwa-later-btn {
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s;
        border: none;
        flex-grow: 1;
      }
      
      .pwa-install-btn {
        background-color: #4f46e5;
        color: white;
      }
      
      .pwa-install-btn:hover {
        background-color: #4338ca;
        box-shadow: 0 4px 6px rgba(79, 70, 229, 0.25);
      }
      
      .pwa-later-btn {
        background-color: #f3f4f6;
        color: #4b5563;
      }
      
      .pwa-later-btn:hover {
        background-color: #e5e7eb;
      }
      
      /* Dark mode styles */
      @media (prefers-color-scheme: dark) {
        .pwa-install-icon {
          background-color: rgba(99, 102, 241, 0.9) !important;
        }
        
        .curved-text {
          color: #818cf8;
          background-color: rgba(99, 102, 241, 0.15);
        }
        
        .pwa-welcome-popup-content {
          background-color: #1f2937;
        }
        
        .pwa-popup-body p, .pwa-popup-body li {
          color: #e5e7eb;
        }
        
        .pwa-popup-footer {
          border-top-color: #374151;
        }
        
        .pwa-later-btn {
          background-color: #374151;
          color: #e5e7eb;
        }
        
        .pwa-later-btn:hover {
          background-color: #4b5563;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Handle welcome popup events
    const closePopupBtn = welcomePopup.querySelector('.pwa-popup-close');
    const installPopupBtn = welcomePopup.querySelector('.pwa-install-btn');
    const laterBtn = welcomePopup.querySelector('.pwa-later-btn');
    
    closePopupBtn.addEventListener('click', () => {
      welcomePopup.classList.remove('visible');
      localStorage.setItem('pwa-popup-shown', 'true');
    });
    
    laterBtn.addEventListener('click', () => {
      welcomePopup.classList.remove('visible');
      localStorage.setItem('pwa-popup-shown', 'true');
    });
    
    installPopupBtn.addEventListener('click', async () => {
      welcomePopup.classList.remove('visible');
      localStorage.setItem('pwa-popup-shown', 'true');
      
      if (deferredPrompt) {
        try {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          deferredPrompt = null;
        } catch (error) {
          console.error('Error showing install prompt:', error);
        }
      }
    });
    
    // Handle install button click
    installButton.addEventListener('click', async () => {
      if (deferredPrompt) {
        try {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          deferredPrompt = null;
        } catch (error) {
          console.error('Error showing install prompt:', error);
        }
      }
    });
    
    // Check for auth events to show the popup for first-time users
    document.addEventListener('auth:signed_in', () => {
      try {
        if (!localStorage.getItem('pwa-popup-shown') && deferredPrompt) {
          setTimeout(() => {
            welcomePopup.classList.add('visible');
          }, 1500);
        }
      } catch (error) {
        console.error('Error showing welcome popup:', error);
      }
    });
  } catch (error) {
    console.error('Error initializing PWA install:', error);
  }
});

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  try {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    
    // Store the event so it can be triggered later
    deferredPrompt = e;
    
    // Show the install container
    if (installContainer) {
      installContainer.style.display = 'flex';
    }
  } catch (error) {
    console.error('Error handling beforeinstallprompt event:', error);
  }
});

// Track when the PWA is installed
window.addEventListener('appinstalled', (e) => {
  try {
    // Log the installation
    console.log('PWA was installed');
    
    // Hide the install container
    if (installContainer) {
      installContainer.style.display = 'none';
    }
    
    if (welcomePopup && welcomePopup.classList.contains('visible')) {
      welcomePopup.classList.remove('visible');
    }
    
    // You could trigger an analytics event here
    if (typeof gtag === 'function') {
      gtag('event', 'pwa_install', {
        'event_category': 'pwa',
        'event_label': 'install',
        'value': 1
      });
    }
  } catch (error) {
    console.error('Error handling appinstalled event:', error);
  }
}); 