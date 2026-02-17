/**
 * AudioSourceSelector - Reusable audio input device selector
 * Automatically enumerates devices and provides selection UI
 */

class AudioSourceSelector {
  constructor(selectElementId, options = {}) {
    this.selectElement = document.getElementById(selectElementId);
    this.availableDevices = [];
    this.selectedDeviceId = null;
    this.onDeviceChange = options.onDeviceChange || null;
    
    // Auto-init on construction
    this.init();
  }
  
  async init() {
    try {
      console.log('[AUDIO SOURCE] Enumerating devices...');
      
      // Request permission first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableDevices = devices.filter(device => device.kind === 'audioinput');
      
      console.log('[AUDIO SOURCE] Found', this.availableDevices.length, 'audio input(s)');
      
      // Populate dropdown
      this.populateDropdown();
      
      // Add change listener
      this.selectElement.addEventListener('change', (e) => {
        this.selectedDeviceId = e.target.value;
        const selectedDevice = this.availableDevices.find(d => d.deviceId === this.selectedDeviceId);
        
        console.log('[AUDIO SOURCE] Selected:', selectedDevice?.label || 'Default');
        console.log('[AUDIO SOURCE] Device ID:', this.selectedDeviceId);
        
        if (this.onDeviceChange) {
          this.onDeviceChange(this.selectedDeviceId, selectedDevice);
        }
      });
      
    } catch (error) {
      console.error('[AUDIO SOURCE] ❌ Error:', error);
      this.selectElement.innerHTML = '<option value="">Erreur: Accès micro refusé</option>';
    }
  }
  
  populateDropdown() {
    this.selectElement.innerHTML = '';
    
    if (this.availableDevices.length === 0) {
      this.selectElement.innerHTML = '<option value="">Aucun périphérique audio</option>';
      return;
    }
    
    this.availableDevices.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Périphérique ${index + 1}`;
      
      // Select first device by default
      if (index === 0) {
        option.selected = true;
        this.selectedDeviceId = device.deviceId;
      }
      
      this.selectElement.appendChild(option);
      
      console.log(`[AUDIO SOURCE] ${index + 1}. ${device.label || 'Unnamed'}`);
    });
  }
  
  getSelectedDeviceId() {
    return this.selectedDeviceId;
  }
  
  getSelectedDevice() {
    return this.availableDevices.find(d => d.deviceId === this.selectedDeviceId);
  }
  
  refresh() {
    this.init();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioSourceSelector;
}
