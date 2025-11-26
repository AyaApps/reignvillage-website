/**
 * Waitlist Email Collection for ReignVillage.com
 *
 * Firebase integration for collecting email signups from the website.
 * Uses Firestore security rules for validation and rate limiting.
 *
 * Setup Instructions:
 * 1. Include Firebase SDK in your HTML:
 *    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
 *    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
 * 2. Include this script: <script src="waitlist.js"></script>
 * 3. Add data attributes to your form:
 *    <form id="waitlist-form">
 *      <input type="email" id="waitlist-email" required>
 *      <button type="submit">Join Waitlist</button>
 *      <div id="waitlist-message"></div>
 *    </form>
 */

// Firebase configuration (uses anonymous auth - no user credentials stored)
const firebaseConfig = {
  apiKey: "AIzaSyCOk_y6CIK7NckIEGzEP3lIIh44nh5EtAY",
  authDomain: "enthusiast-c3c4a.firebaseapp.com",
  projectId: "enthusiast-c3c4a",
  storageBucket: "enthusiast-c3c4a.firebasestorage.app",
  messagingSenderId: "346764879831",
  appId: "1:346764879831:web:e1eac80a2e3652a95de58f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/**
 * Validates email format
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Gets the source/page where the signup occurred
 */
function getSignupSource() {
  const pathname = window.location.pathname;
  if (pathname === '/' || pathname === '/index.html') return 'homepage';
  if (pathname.includes('company')) return 'company';
  if (pathname.includes('contact')) return 'contact';
  return 'website';
}

/**
 * Submits email to Firebase waitlist collection
 */
async function submitToWaitlist(email) {
  try {
    // Validate email format
    if (!isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    // Check for rate limiting (max 1 submission per minute from same client)
    const lastSubmit = localStorage.getItem('waitlist_last_submit');
    if (lastSubmit) {
      const timeSinceLastSubmit = Date.now() - parseInt(lastSubmit);
      if (timeSinceLastSubmit < 60000) { // 1 minute
        const secondsLeft = Math.ceil((60000 - timeSinceLastSubmit) / 1000);
        throw new Error(`Please wait ${secondsLeft} seconds before submitting again`);
      }
    }

    // Add to Firestore
    await db.collection('waitlist').add({
      email: email.toLowerCase().trim(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      source: getSignupSource()
    });

    // Store timestamp for rate limiting
    localStorage.setItem('waitlist_last_submit', Date.now().toString());

    return { success: true };
  } catch (error) {
    console.error('Waitlist submission error:', error);

    // Handle Firestore security rule violations
    if (error.code === 'permission-denied') {
      throw new Error('Unable to submit. Please check your email and try again.');
    }

    throw error;
  }
}

/**
 * Shows message to user
 */
function showMessage(message, isError = false) {
  const messageEl = document.getElementById('waitlist-message');
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.className = isError ? 'error-message' : 'success-message';
    messageEl.style.display = 'block';

    // Hide after 5 seconds for success messages
    if (!isError) {
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 5000);
    }
  }
}

/**
 * Initializes the waitlist form
 */
function initWaitlistForm() {
  const form = document.getElementById('waitlist-form');
  const emailInput = document.getElementById('waitlist-email');

  if (!form || !emailInput) {
    console.warn('Waitlist form elements not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const submitButton = form.querySelector('button[type="submit"]');

    // Disable button during submission
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Joining...';
    }

    try {
      await submitToWaitlist(email);
      showMessage("Thanks for signing up! We'll notify you when RevvRadar launches.");
      emailInput.value = ''; // Clear input
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      // Re-enable button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Join Waitlist';
      }
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWaitlistForm);
} else {
  initWaitlistForm();
}

// Export for manual initialization if needed
window.ReignVillageWaitlist = {
  init: initWaitlistForm,
  submit: submitToWaitlist
};
