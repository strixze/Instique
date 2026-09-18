import { gateSecurityApi } from '../api/gateSecurity.api';

/**
 * Clean RFID Input Abstraction.
 * Supports the temporary Mock RFID simulation today and allows transparently
 * plugging in real RFID hardware (e.g. keyboard wedge, serial, or WebUSB)
 * later without changing any Gate Security dashboard or business logic.
 */
class RfidAdapter {
  constructor() {
    this.listeners = new Set();
    this.isMock = true;
  }

  /**
   * Handle an incoming RFID scan (from mock button, manual entry, or hardware reader)
   * @param {string} rfidIdentifier - The unique card/tag identifier string
   * @param {string} gate - Optional gate identifier
   * @returns {Promise<object>} The scan and verification result
   */
  async handleRfidScan(rfidIdentifier, gate = 'Main Gate') {
    if (!rfidIdentifier || !rfidIdentifier.trim()) {
      throw new Error('Please provide or scan a valid RFID tag');
    }

    const payload = {
      rfidTag: rfidIdentifier.trim(),
      gate,
    };

    // Forward to backend gate security service
    const response = await gateSecurityApi.scanRfid(payload);
    const result = response.data || response;

    // Notify registered listeners (e.g. dashboard, activity feed, audio alerts)
    this.notifyListeners(result);

    return result;
  }

  /**
   * Fetch available mock RFID tags associated with real active students
   * for quick simulation in dev/mock environment.
   */
  async getMockTags() {
    const response = await gateSecurityApi.getMockTags();
    return response.data || response || [];
  }

  /**
   * Register a listener for real-time scan events
   */
  onScan(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(data) {
    this.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error('[RfidAdapter] Listener notification error:', err);
      }
    });
  }
}

export const rfidAdapter = new RfidAdapter();
export default rfidAdapter;
