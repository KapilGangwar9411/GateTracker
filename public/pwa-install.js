// PWA Installation Helper
let deferredPrompt;
const installButton = document.createElement('button');
installButton.style.display = 'none';
installButton.classList.add('pwa-install-button');
installButton.textContent = 'Install App';

document.addEventListener('DOMContentLoaded', () => {
  document.body.appendChild(installButton);
  
  // Style the button
  installButton.style.position = 'fixed';
  installButton.style.bottom = '20px';
  installButton.style.right = '20px';
  installButton.style.backgroundColor = '#4f46e5';
  installButton.style.color = 'white';
  installButton.style.padding = '12px 20px';
  installButton.style.borderRadius = '8px';
  installButton.style.border = 'none';
  installButton.style.fontWeight = 'bold';
  installButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  installButton.style.zIndex = '9999';
  installButton.style.cursor = 'pointer';
  
  installButton.addEventListener('click', async () => {
    // Hide the button
    installButton.style.display = 'none';
    
    // Show the install prompt
    if (deferredPrompt) {
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      
      // Clear the deferred prompt variable
      deferredPrompt = null;
    }
  });
});

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  
  // Store the event so it can be triggered later
  deferredPrompt = e;
  
  // Show the install button
  installButton.style.display = 'block';
});

// Track when the PWA is installed
window.addEventListener('appinstalled', (e) => {
  // Log the installation
  console.log('PWA was installed');
  
  // Hide the install button
  installButton.style.display = 'none';
  
  // You could trigger an analytics event here
  if (typeof gtag === 'function') {
    gtag('event', 'pwa_install', {
      'event_category': 'pwa',
      'event_label': 'install',
      'value': 1
    });
  }
}); 