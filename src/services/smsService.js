/**
 * Real-Time SMS Gateway Service
 * Handles live SMS OTP dispatch via Fast2SMS, 2Factor.in, Twilio, and Custom Webhooks
 */

export const smsService = {
  // 1. Send real-time OTP to mobile phone
  async sendOtpSms(mobile, otp) {
    const cleanMobile = String(mobile || '').replace(/\D/g, '').slice(-10);
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: cleanMobile,
          otp: String(otp),
          message: `??????! Dairy Farm Pro ?? ?? ??? ???? ????? OTP: ${otp} ??? ?? 5 ???? ?? ??? ??? ???`
        })
      });

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('smsService.sendOtpSms network error:', err);
      return {
        success: false,
        error: '????? ?? ?????? ???? ?? ????: ' + err.message
      };
    }
  },

  // 2. Fetch current SMS Gateway Configuration
  async getSmsConfig() {
    try {
      const response = await fetch('/api/sms/config');
      return await response.json();
    } catch (err) {
      console.warn('smsService.getSmsConfig error:', err);
      return null;
    }
  },

  // 3. Save SMS Gateway Configuration (API keys, provider)
  async saveSmsConfig(config) {
    try {
      const response = await fetch('/api/sms/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return await response.json();
    } catch (err) {
      console.error('smsService.saveSmsConfig error:', err);
      return { success: false, error: err.message };
    }
  },

  // 4. Send a test SMS to verify gateway credentials
  async sendTestSms(mobile, provider = 'fast2sms') {
    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    return await this.sendOtpSms(mobile, testOtp);
  }
};
