// Razorpay Loader with comprehensive fallback mechanisms
class RazorpayLoader {
    constructor() {
        this.isLoaded = false;
        this.isLoading = false;
        this.callbacks = [];
        this.maxRetries = 3;
        this.currentRetry = 0;
    }

    // Check if Razorpay is already available
    isRazorpayAvailable() {
        return typeof window.Razorpay !== 'undefined';
    }

    // Load Razorpay with multiple fallback methods
    async loadRazorpay() {
        if (this.isRazorpayAvailable()) {
            console.log('✅ Razorpay already loaded');
            this.isLoaded = true;
            this.executeCallbacks();
            return true;
        }

        if (this.isLoading) {
            console.log('⏳ Razorpay loading in progress...');
            return new Promise(resolve => {
                this.callbacks.push(resolve);
            });
        }

        this.isLoading = true;
        console.log('🔄 Loading Razorpay...');

        // Method 1: Direct script injection
        const success = await this.loadViaScript();
        
        if (!success && this.currentRetry < this.maxRetries) {
            this.currentRetry++;
            console.log(`🔄 Retry ${this.currentRetry}/${this.maxRetries}`);
            await this.delay(1000); // Wait 1 second before retry
            return this.loadRazorpay();
        }

        this.isLoading = false;
        
        if (success) {
            this.isLoaded = true;
            this.executeCallbacks();
            console.log('✅ Razorpay loaded successfully');
        } else {
            console.error('❌ Failed to load Razorpay after all retries');
            this.executeCallbacks(false);
        }

        return success;
    }

    // Load via script tag injection
    loadViaScript() {
        return new Promise((resolve) => {
            // Remove any existing Razorpay scripts
            const existingScripts = document.querySelectorAll('script[src*="razorpay"]');
            existingScripts.forEach(script => script.remove());

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            
            const timeout = setTimeout(() => {
                console.error('❌ Razorpay script timeout');
                resolve(false);
            }, 10000); // 10 second timeout

            script.onload = () => {
                clearTimeout(timeout);
                console.log('✅ Razorpay script loaded');
                
                // Double check if Razorpay object is available
                if (this.isRazorpayAvailable()) {
                    resolve(true);
                } else {
                    console.error('❌ Razorpay script loaded but object not available');
                    resolve(false);
                }
            };

            script.onerror = () => {
                clearTimeout(timeout);
                console.error('❌ Razorpay script failed to load');
                resolve(false);
            };

            document.head.appendChild(script);
        });
    }

    // Execute all pending callbacks
    executeCallbacks(success = true) {
        this.callbacks.forEach(callback => {
            if (typeof callback === 'function') {
                callback(success);
            }
        });
        this.callbacks = [];
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Public method to ensure Razorpay is loaded
    ensureLoaded() {
        return new Promise((resolve) => {
            if (this.isRazorpayAvailable()) {
                resolve(true);
                return;
            }

            this.callbacks.push(resolve);
            if (!this.isLoading) {
                this.loadRazorpay();
            }
        });
    }
}

// Global instance
window.razorpayLoader = new RazorpayLoader();

// Auto-load when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.razorpayLoader.loadRazorpay();
    });
} else {
    window.razorpayLoader.loadRazorpay();
}
