// Tournament Management System for Free Fire Tournament Registration
class TournamentManager {
    constructor() {
        this.currentTournament = null;
        this.registrationData = null;
        this.supabaseClient = null;
        
        // API Base URL configuration for different environments
        this.API_BASE = this.getApiBaseUrl();
        
        // Initialize Supabase for real-time updates
        this.initializeSupabase();
        
        this.bindEvents();
        this.loadTournaments();
    }

    // Get API base URL based on environment
    getApiBaseUrl() {
        const hostname = window.location.hostname;
        
        // Netlify deployment - use Netlify Functions
        if (hostname.includes('netlify.app')) {
            return '/.netlify/functions';
        }
        
        // Local development with Netlify Dev
        if (hostname === 'localhost' && window.location.port === '8888') {
            return '/.netlify/functions';
        }
        
        // Local development with Express server
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8000/api';
        }
        
        // Default fallback for Netlify Functions
        return '/.netlify/functions';
    }

    // Initialize Supabase for real-time updates
    initializeSupabase() {
        const supabaseUrl = 'https://fmbdbzptumkphheqhrgt.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtYmRienB0dW1rcGhoZXFocmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTgyMjQsImV4cCI6MjA3MDQ5NDIyNH0.hatO5BeLFWd5KzlyPO1ayyI45w-SxOpLlMMpQout6lM';
        
        try {
            if (typeof supabase !== 'undefined') {
                this.supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
                this.setupRealtimeSubscriptions();
                console.log('✅ Supabase real-time connected successfully');
            } else {
                console.warn('⚠️ Supabase client not loaded. Add Supabase script to HTML.');
            }
        } catch (error) {
            console.error('❌ Supabase initialization failed:', error);
        }
    }

    // Setup real-time subscriptions for live updates
    setupRealtimeSubscriptions() {
        if (!this.supabaseClient) return;

        // Subscribe to tournament seat updates
        this.supabaseClient
            .channel('tournament-updates')
            .on('postgres_changes', 
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'tournaments' 
                },
                (payload) => {
                    this.handleTournamentUpdate(payload);
                }
            )
            .subscribe((status) => {
                console.log('🔄 Tournament updates subscription:', status);
            });

        // Subscribe to new registrations
        this.supabaseClient
            .channel('registration-updates')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'registrations' 
                },
                (payload) => {
                    this.handleNewRegistration(payload);
                }
            )
            .subscribe((status) => {
                console.log('🔄 Registration updates subscription:', status);
            });
    }

    // Handle real-time tournament updates
    handleTournamentUpdate(payload) {
        const updatedTournament = payload.new;
        
        if (this.currentTournament && updatedTournament.id === this.currentTournament.id) {
            console.log('🔄 Live tournament update received:', updatedTournament.available_seats, 'seats remaining');
            
            // Update available seats in real-time
            this.currentTournament.available_seats = updatedTournament.available_seats;
            this.updateSeatDisplay(updatedTournament.available_seats, this.currentTournament.total_seats);
            
            // Show notifications for seat availability
            if (updatedTournament.available_seats <= 5 && updatedTournament.available_seats > 0) {
                this.showNotification(`⚠️ Only ${updatedTournament.available_seats} seats remaining! Book now!`, 'warning');
            } else if (updatedTournament.available_seats === 0) {
                this.showNotification('🚫 Tournament is now FULL! Registration closed.', 'danger');
                this.disableBookingButton();
            } else if (updatedTournament.available_seats <= 10) {
                this.showNotification(`⏰ ${updatedTournament.available_seats} seats left - Hurry up!`, 'info');
            }
        }
    }

    // Handle new registration notifications
    handleNewRegistration(payload) {
        const newRegistration = payload.new;
        
        if (this.currentTournament && newRegistration.tournament_id === this.currentTournament.id) {
            console.log('🎮 New player registered:', newRegistration.name);
            
            // Update seat counter locally for immediate feedback
            if (this.currentTournament.available_seats > 0) {
                this.currentTournament.available_seats--;
                this.updateSeatDisplay(this.currentTournament.available_seats, this.currentTournament.total_seats);
            }
            
            // Show new registration notification
            this.showNotification(`🎮 ${newRegistration.name} just joined the tournament!`, 'success');
        }
    }

    // Disable booking button when tournament is full
    disableBookingButton() {
        const bookButtons = document.querySelectorAll('.btn-book');
        bookButtons.forEach(btn => {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-ban me-2"></i>Tournament Full';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
        });
    }

    // Show real-time notifications
    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.live-notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed live-notification`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 350px; max-width: 400px;';
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="me-2">
                    ${type === 'success' ? '🎉' : type === 'warning' ? '⚠️' : type === 'danger' ? '🚫' : 'ℹ️'}
                </div>
                <div class="flex-grow-1">${message}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Bind event listeners
    bindEvents() {
        // Book slot button
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-book')) {
                e.preventDefault();
                const tournamentId = e.target.closest('.tournament-card').dataset.tournamentId || 'current-tournament';
                this.bookSlot(tournamentId);
            }
        });

        // Initialize modals when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeModals();
            });
        } else {
            this.initializeModals();
        }
    }

    // Initialize modals
    initializeModals() {
        this.createTermsModal();
        this.createRegistrationModal();
        this.createSuccessModal();
        this.createErrorModal();
    }

    // Load tournaments from API or demo data
    async loadTournaments() {
        try {
            // Try API call
            const response = await fetch(`${this.API_BASE}/tournaments`);
            const data = await response.json();
            
            if (data.success && data.tournaments.length > 0) {
                this.currentTournament = data.tournaments[0];
                this.updateTournamentUI(this.currentTournament);
                return;
            }
        } catch (error) {
            console.error('Error loading tournaments:', error);
        }

        // Fallback to demo tournament
        console.log('🎮 Using demo tournament data');
        this.currentTournament = {
            id: 'demo-tournament',
            title: 'Free Fire Championship',
            entry_fee: 75,
            available_seats: 48,
            total_seats: 48,
            tournament_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
            prize_pool: { first: 1000, second: 700, third: 500 }
        };
        this.updateTournamentUI(this.currentTournament);
    }

    // Update tournament UI
    updateTournamentUI(tournament) {
        this.currentTournament = tournament;
        
        const tournamentCard = document.querySelector('.current-tournament');
        if (tournamentCard) {
            tournamentCard.dataset.tournamentId = tournament.id;
            
            const titleElement = tournamentCard.querySelector('.tournament-title');
            if (titleElement) titleElement.textContent = tournament.title;
            
            const dateElement = tournamentCard.querySelector('.tournament-date');
            if (dateElement) {
                const date = new Date(tournament.tournament_date);
                dateElement.innerHTML = `<i class="fas fa-calendar me-2"></i>${date.toLocaleDateString()} - ${date.toLocaleTimeString()}`;
            }
            
            const feeElement = tournamentCard.querySelector('.tournament-fee');
            if (feeElement) {
                feeElement.innerHTML = `<i class="fas fa-ticket-alt me-2"></i>Entry Fee: ₹${tournament.entry_fee}`;
            }
            
            const prizePool = tournament.prize_pool || { first: 1000, second: 700, third: 500 };
            const prizeElement = tournamentCard.querySelector('.prize-pool ul');
            if (prizeElement) {
                prizeElement.innerHTML = `
                    <li>🥇 1st Place: ₹${prizePool.first}</li>
                    <li>🥈 2nd Place: ₹${prizePool.second}</li>
                    <li>🥉 3rd Place: ₹${prizePool.third}</li>
                `;
            }
            
            this.updateSeatDisplay(tournament.available_seats, tournament.total_seats);
            this.updateHeroPrizes(prizePool);
        }
    }

    // Update seat display with real-time visual effects
    updateSeatDisplay(available, total) {
        const seatsElement = document.getElementById('currentSeats');
        const totalElement = document.querySelector('.total-seats');
        
        if (seatsElement) {
            // Add animation effect for seat changes
            seatsElement.style.transform = 'scale(1.2)';
            seatsElement.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                seatsElement.textContent = available;
                seatsElement.className = available > 10 ? 'seats-number text-success' : 
                                       available > 5 ? 'seats-number text-warning' : 
                                       'seats-number text-danger';
                
                // Add pulsing effect for low seats
                if (available <= 5 && available > 0) {
                    seatsElement.classList.add('animate__animated', 'animate__pulse', 'animate__infinite');
                } else {
                    seatsElement.classList.remove('animate__animated', 'animate__pulse', 'animate__infinite');
                }
                
                seatsElement.style.transform = 'scale(1)';
            }, 150);
        }
        
        if (totalElement) {
            totalElement.textContent = `(${total} Total)`;
        }

        const bookButtons = document.querySelectorAll('.btn-book');
        bookButtons.forEach(btn => {
            if (available <= 0) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-times me-2"></i>Sold Out';
                btn.classList.add('btn-secondary');
                btn.classList.remove('btn-primary');
            } else {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-fire me-2"></i>Book Your Slot';
                btn.classList.add('btn-primary');
                btn.classList.remove('btn-secondary');
            }
        });
    }

    // Update hero section prizes
    updateHeroPrizes(prizePool) {
        const heroPrizeCards = document.getElementById('heroPrizeCards');
        if (heroPrizeCards) {
            heroPrizeCards.innerHTML = `
                <div class="col-4">
                    <div class="prize-card first">
                        <div class="prize-amount">₹${prizePool.first}</div>
                        <div class="prize-place">1st Place</div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="prize-card second">
                        <div class="prize-amount">₹${prizePool.second}</div>
                        <div class="prize-place">2nd Place</div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="prize-card third">
                        <div class="prize-amount">₹${prizePool.third}</div>
                        <div class="prize-place">3rd Place</div>
                    </div>
                </div>
            `;
        }
    }

    // Book slot process
    async bookSlot(tournamentId) {
        if (!this.currentTournament) {
            this.showError('Tournament data not available');
            return;
        }

        if (this.currentTournament.available_seats <= 0) {
            this.showError('No seats available for this tournament');
            return;
        }

        this.showTermsModal();
    }

    // Create and show terms modal
    createTermsModal() {
        const modalHTML = `
            <div class="modal fade" id="termsModal" tabindex="-1" aria-labelledby="termsModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content bg-dark border-primary">
                        <div class="modal-header border-primary">
                            <h5 class="modal-title text-primary" id="termsModalLabel">
                                <i class="fas fa-scroll me-2"></i>Terms & Conditions
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="terms-content">
                                <h6 class="text-warning mb-3">Tournament Rules</h6>
                                <ul class="list-unstyled">
                                    <li class="mb-2"><i class="fas fa-check text-success me-2"></i>All players must register before the tournament deadline</li>
                                    <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Entry fee must be paid to confirm participation</li>
                                    <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Players must join the lobby 15 minutes before start time</li>
                                    <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Use of any cheats or hacks is strictly prohibited</li>
                                    <li class="mb-2"><i class="fas fa-check text-success me-2"></i>Room ID and password will be shared in WhatsApp group</li>
                                </ul>
                                
                                <h6 class="text-warning mb-3 mt-4">Refund Policy</h6>
                                <ul class="list-unstyled">
                                    <li class="mb-2"><i class="fas fa-info-circle text-info me-2"></i>No refunds once tournament has started</li>
                                    <li class="mb-2"><i class="fas fa-info-circle text-info me-2"></i>Technical issues: case-by-case evaluation</li>
                                    <li class="mb-2"><i class="fas fa-info-circle text-info me-2"></i>Server problems: full refund or reschedule</li>
                                    <li class="mb-2"><i class="fas fa-info-circle text-info me-2"></i>Cancellation before start: 90% refund</li>
                                </ul>
                            </div>
                            
                            <div class="agreement-section mt-4">
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="acceptTerms" required>
                                    <label class="form-check-label text-white" for="acceptTerms">
                                        I have read and agree to the <strong>Terms & Conditions</strong>
                                    </label>
                                </div>
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="acceptRefund" required>
                                    <label class="form-check-label text-white" for="acceptRefund">
                                        I understand and accept the <strong>Refund Policy</strong>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-primary">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="proceedToRegistration" disabled>
                                <i class="fas fa-arrow-right me-2"></i>Proceed to Registration
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('termsModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const acceptTerms = document.getElementById('acceptTerms');
        const acceptRefund = document.getElementById('acceptRefund');
        const proceedBtn = document.getElementById('proceedToRegistration');

        function checkAgreements() {
            proceedBtn.disabled = !(acceptTerms.checked && acceptRefund.checked);
        }

        acceptTerms.addEventListener('change', checkAgreements);
        acceptRefund.addEventListener('change', checkAgreements);

        proceedBtn.addEventListener('click', () => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('termsModal'));
            modal.hide();
            this.showRegistrationForm();
        });
    }

    showTermsModal() {
        const modal = new bootstrap.Modal(document.getElementById('termsModal'));
        modal.show();
    }

    // Create registration form modal
    createRegistrationModal() {
        const modalHTML = `
            <div class="modal fade" id="registrationModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content bg-dark border-primary">
                        <div class="modal-header border-primary">
                            <h5 class="modal-title text-primary">
                                <i class="fas fa-user-plus me-2"></i>Tournament Registration
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="registrationForm">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <label for="userName" class="form-label text-warning">
                                            <i class="fas fa-user me-1"></i>Full Name (as per bank account) *
                                        </label>
                                        <input type="text" class="form-control bg-dark text-white border-secondary" 
                                               id="userName" name="name" required>
                                        <div class="form-text text-muted">Enter your complete legal name</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="userAge" class="form-label text-warning">
                                            <i class="fas fa-birthday-cake me-1"></i>Age *
                                        </label>
                                        <input type="number" class="form-control bg-dark text-white border-secondary" 
                                               id="userAge" name="age" min="13" max="99" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="gameId" class="form-label text-warning">
                                            <i class="fas fa-gamepad me-1"></i>Free Fire Game ID *
                                        </label>
                                        <input type="text" class="form-control bg-dark text-white border-secondary" 
                                               id="gameId" name="gameId" required>
                                        <div class="form-text text-muted">Your numeric Free Fire ID</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="gameUsername" class="form-label text-warning">
                                            <i class="fas fa-user-tag me-1"></i>Free Fire Username *
                                        </label>
                                        <input type="text" class="form-control bg-dark text-white border-secondary" 
                                               id="gameUsername" name="gameUsername" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="phoneNumber" class="form-label text-warning">
                                            <i class="fas fa-phone me-1"></i>Phone Number (linked to bank) *
                                        </label>
                                        <input type="tel" class="form-control bg-dark text-white border-secondary" 
                                               id="phoneNumber" name="phone" pattern="[0-9]{10}" required>
                                        <div class="form-text text-muted">10-digit mobile number</div>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="email" class="form-label text-warning">
                                            <i class="fas fa-envelope me-1"></i>Email Address *
                                        </label>
                                        <input type="email" class="form-control bg-dark text-white border-secondary" 
                                               id="email" name="email" required>
                                    </div>
                                </div>
                                
                                <div class="tournament-summary mt-4 p-3 bg-primary bg-opacity-10 border border-primary rounded">
                                    <h6 class="text-primary mb-2">Tournament Summary</h6>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <p class="mb-1"><strong>Tournament:</strong> <span id="summaryTitle">Free Fire Championship</span></p>
                                            <p class="mb-1"><strong>Entry Fee:</strong> ₹<span id="summaryFee">75</span></p>
                                        </div>
                                        <div class="col-md-6">
                                            <p class="mb-1"><strong>Available Seats:</strong> <span id="summarySeats">48</span></p>
                                            <p class="mb-1"><strong>Prize Pool:</strong> ₹<span id="summaryPrize">2200</span></p>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer border-primary">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-success" id="proceedToPayment">
                                <i class="fas fa-credit-card me-2"></i>Proceed to Payment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('registrationModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('proceedToPayment').addEventListener('click', () => {
            this.processRegistration();
        });
    }

    showRegistrationForm() {
        if (this.currentTournament) {
            document.getElementById('summaryTitle').textContent = this.currentTournament.title;
            document.getElementById('summaryFee').textContent = this.currentTournament.entry_fee;
            document.getElementById('summarySeats').textContent = this.currentTournament.available_seats;
            
            const prizePool = this.currentTournament.prize_pool || {};
            const totalPrize = (prizePool.first || 0) + (prizePool.second || 0) + (prizePool.third || 0);
            document.getElementById('summaryPrize').textContent = totalPrize;
        }

        const modal = new bootstrap.Modal(document.getElementById('registrationModal'));
        modal.show();
    }

    async processRegistration() {
        const form = document.getElementById('registrationForm');
        const formData = new FormData(form);
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const userDetails = {
            name: formData.get('name'),
            age: parseInt(formData.get('age')),
            gameId: formData.get('gameId'),
            gameUsername: formData.get('gameUsername'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            termsAccepted: true,
            refundPolicyAccepted: true
        };

        this.registrationData = userDetails;

        try {
            const submitBtn = document.getElementById('proceedToPayment');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
            submitBtn.disabled = true;

            const response = await fetch(`${this.API_BASE}/payment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId: this.currentTournament.id,
                    userDetails: userDetails
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to create payment order');
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById('registrationModal'));
            modal.hide();

            this.initiatePayment(data.order, data.registrationId);

        } catch (error) {
            console.error('Registration error:', error);
            this.showError(error.message || 'Registration failed. Please try again.');
            
            const submitBtn = document.getElementById('proceedToPayment');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-credit-card me-2"></i>Proceed to Payment';
                submitBtn.disabled = false;
            }
        }
    }

    async initiatePayment(order, registrationId) {
        console.log('💳 Initiating payment process...');
        
        try {
            // Show loading state
            const submitBtn = document.getElementById('proceedToPayment');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading Payment...';
                submitBtn.disabled = true;
            }

            // Use the robust Razorpay loader
            let razorpayAvailable = false;
            
            if (window.razorpayLoader) {
                console.log('🔄 Using Razorpay loader...');
                razorpayAvailable = await window.razorpayLoader.ensureLoaded();
            } else {
                console.log('⚠️ Razorpay loader not available, checking directly...');
                razorpayAvailable = typeof Razorpay !== 'undefined';
            }

            if (razorpayAvailable) {
                console.log('✅ Razorpay confirmed available');
                this.startRazorpayPayment(order, registrationId);
            } else {
                console.error('❌ Razorpay not available after loading attempts');
                this.showRazorpayError();
            }

        } catch (error) {
            console.error('❌ Payment initiation error:', error);
            this.showRazorpayError();
        }
    }

    showRazorpayError() {
        this.showError(`
            Payment system is currently unavailable. This could be due to:
            • Ad blocker blocking payment scripts
            • Network connectivity issues
            • Browser security settings
            
            Please try:
            1. Disable ad blocker for this site
            2. Refresh the page (Ctrl+F5)
            3. Try a different browser
            4. Check your internet connection
        `);
        
        // Reset submit button
        const submitBtn = document.getElementById('proceedToPayment');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-credit-card me-2"></i>Proceed to Payment';
            submitBtn.disabled = false;
        }
    }

    startRazorpayPayment(order, registrationId) {
        const options = {
            key: 'rzp_test_apasTFRm3P1Vuw',
            amount: order.amount,
            currency: order.currency,
            name: 'Hyper XP',
            description: `${this.currentTournament.title} - Tournament Registration`,
            order_id: order.id,
            handler: (response) => {
                this.verifyPayment(response, registrationId);
            },
            prefill: {
                name: this.registrationData.name,
                email: this.registrationData.email,
                contact: this.registrationData.phone
            },
            theme: { color: '#ff6b35' },
            modal: {
                ondismiss: () => {
                    this.handlePaymentFailure(registrationId);
                }
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
    }

    async verifyPayment(response, registrationId) {
        try {
            const verifyResponse = await fetch(`${this.API_BASE}/payment/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    registrationId: registrationId
                })
            });

            const data = await verifyResponse.json();

            if (data.success) {
                this.showSuccess(data.seatNumber);
                this.updateSeatCounter();
            } else {
                throw new Error(data.message || 'Payment verification failed');
            }

        } catch (error) {
            console.error('Payment verification error:', error);
            this.showError('Payment verification failed. Please contact support.');
            this.handlePaymentFailure(registrationId);
        }
    }

    async handlePaymentFailure(registrationId) {
        try {
            // Note: Payment failure endpoint not implemented in Netlify Functions yet
            // This is handled by the payment verification timeout
            console.log('Payment failed for registration:', registrationId);
        } catch (error) {
            console.error('Error handling payment failure:', error);
        }
    }

    async updateSeatCounter() {
        try {
            // Use real-time data if Supabase is connected, otherwise fallback to API
            if (this.supabaseClient) {
                const { data, error } = await this.supabaseClient
                    .from('tournaments')
                    .select('available_seats, total_seats')
                    .eq('id', this.currentTournament.id)
                    .single();
                
                if (error) throw error;
                
                if (data) {
                    console.log('📊 Real-time seat data updated:', data.available_seats, 'available');
                    this.updateSeatDisplay(data.available_seats, data.total_seats);
                }
            } else {
                // Fallback to API call
                const response = await fetch(`${this.API_BASE}/tournaments`);
                const data = await response.json();
                
                if (data.success && data.tournaments.length > 0) {
                    const tournament = data.tournaments.find(t => t.id === this.currentTournament.id) || data.tournaments[0];
                    this.updateSeatDisplay(tournament.available_seats, tournament.total_seats);
                }
            }
        } catch (error) {
            console.error('Error updating seat counter:', error);
        }
    }

    createSuccessModal() {
        const modalHTML = `
            <div class="modal fade" id="successModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content bg-dark border-success">
                        <div class="modal-header border-success">
                            <h5 class="modal-title text-success">
                                <i class="fas fa-check-circle me-2"></i>Registration Successful!
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center">
                            <div class="success-animation mb-3">
                                <i class="fas fa-trophy text-warning" style="font-size: 3rem;"></i>
                            </div>
                            <h4 class="text-success mb-3">Welcome to the Tournament!</h4>
                            <p class="text-white mb-3">Your seat has been confirmed.</p>
                            <div class="seat-info p-3 bg-success bg-opacity-10 border border-success rounded">
                                <h5 class="text-warning mb-2">Your Seat Number</h5>
                                <div class="seat-number-display" style="font-size: 2rem; font-weight: bold; color: #ff6b35;" id="assignedSeatNumber">
                                    #1
                                </div>
                            </div>
                            <div class="next-steps mt-4">
                                <h6 class="text-warning">Next Steps:</h6>
                                <ol class="text-start text-white-50">
                                    <li>Join our WhatsApp group for updates</li>
                                    <li>Room ID will be shared 15 minutes before tournament</li>
                                    <li>Be ready 10 minutes before start time</li>
                                </ol>
                            </div>
                        </div>
                        <div class="modal-footer border-success">
                            <a href="https://chat.whatsapp.com/hyperxp" class="btn btn-success" target="_blank">
                                <i class="fab fa-whatsapp me-2"></i>Join WhatsApp Group
                            </a>
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    showSuccess(seatNumber) {
        document.getElementById('assignedSeatNumber').textContent = `#${seatNumber}`;
        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        modal.show();
    }

    createErrorModal() {
        const modalHTML = `
            <div class="modal fade" id="errorModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content bg-dark border-danger">
                        <div class="modal-header border-danger">
                            <h5 class="modal-title text-danger">
                                <i class="fas fa-exclamation-triangle me-2"></i>Error
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center">
                                <i class="fas fa-times-circle text-danger mb-3" style="font-size: 3rem;"></i>
                                <p class="text-white" id="errorMessage">Something went wrong. Please try again.</p>
                            </div>
                        </div>
                        <div class="modal-footer border-danger">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="location.reload()">Refresh Page</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        const modal = new bootstrap.Modal(document.getElementById('errorModal'));
        modal.show();
    }
}

// Global functions for backward compatibility
window.bookSlot = function(tournamentId) {
    if (window.tournamentManager) {
        window.tournamentManager.bookSlot(tournamentId);
    }
};

// Remove automatic initialization - handled by HTML script loader
// document.addEventListener('DOMContentLoaded', function() {
//     window.tournamentManager = new TournamentManager();
// });
