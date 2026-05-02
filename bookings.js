const BOOKINGS_STORAGE_KEY = 'belarus_voyage_bookings';
let currentBookingTour = '';

function getAllBookings() { return JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY) || '[]'); }
function saveAllBookings(bookings) { localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings)); }
function getUserBookings(email) {
    const all = getAllBookings();
    if (!email) return [];
    return all.filter(b => b.email && b.email.toLowerCase() === email.toLowerCase());
}

function saveUserBooking(booking) {
    const all = getAllBookings();
    all.push({
        ...booking,
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        createdAt: new Date().toISOString(),
        status: 'pending'
    });
    saveAllBookings(all);
}

function showNotification(msg, type = 'success') {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    const icon = type === 'error' ? '⚠️' : '✅';
    notification.innerHTML = `${icon} ${msg}`;
    notification.style.background = type === 'error' ? '#c0392b' : '#001f3f';
    notification.style.display = 'flex';
    setTimeout(() => { notification.style.display = 'none'; }, 4000);
}

window.openBooking = function(tourName) {
    currentBookingTour = tourName;
    const modal = document.getElementById('bookingModal');
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.innerText = 'Book ' + tourName;
    if (modal) modal.style.display = 'flex';
};

window.closeBookingModal = function() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.style.display = 'none';
};

function processBooking(formElement) {
    const inputs = formElement.querySelectorAll('input');
    let fullName = '', email = '', phone = '', travelers = 1, date = '', telegram = '';
    for (let input of inputs) {
        const placeholder = (input.placeholder || '').toLowerCase();
        const type = input.type;
        const name = (input.name || '').toLowerCase();
        if (placeholder.includes('full name') || placeholder.includes('name') || name === 'name') fullName = input.value;
        else if (placeholder.includes('email') || type === 'email' || name === 'email') email = input.value;
        else if (placeholder.includes('phone') || type === 'tel' || name === 'phone') phone = input.value;
        else if (placeholder.includes('travelers') || placeholder.includes('travel') || type === 'number' || name === 'travelers') travelers = parseInt(input.value) || 1;
        else if (type === 'date' || placeholder.includes('date') || name === 'date') date = input.value;
        else if (placeholder.includes('telegram') || name === 'telegram') telegram = input.value.replace('@', '').trim();
    }
    if (!fullName) { showNotification('⚠️ Enter your full name', 'error'); return false; }
    if (!email || !email.includes('@')) { showNotification('⚠️ Enter valid email', 'error'); return false; }
    if (!date) { showNotification('⚠️ Select travel date', 'error'); return false; }
    if (travelers < 1) { showNotification('⚠️ At least 1 traveler', 'error'); return false; }

    const booking = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        tourName: currentBookingTour,
        fullName, email, phone, telegram, travelers, date,
        bookedAt: new Date().toLocaleString(),
        status: 'pending'
    };
    const all = getAllBookings();
    all.push(booking);
    saveAllBookings(all);
    showNotification(`✅ BOOKED! ${booking.tourName} on ${booking.date} for ${booking.travelers} person(s).`, 'success');

    if (telegram && window.sendTelegramMessage) {
        window.sendTelegramMessage('@' + telegram, `🎉 Booking Confirmed!\n\n🏰 ${booking.tourName}\n📅 ${booking.date}\n👥 ${booking.travelers} travelers\n\nThank you for choosing Belarus Voyage!`);
    }
    if (window.notifyAdminNewBooking) window.notifyAdminNewBooking(booking);
    return true;
}

function initBookingSystem() {
    const bookingForm = document.getElementById('bookingForm');
    if (!bookingForm) { setTimeout(initBookingSystem, 500); return; }
    const newForm = bookingForm.cloneNode(true);
    bookingForm.parentNode.replaceChild(newForm, bookingForm);
    newForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : 'Confirm Booking';
        if (submitBtn) { submitBtn.innerHTML = '⏳ PROCESSING...'; submitBtn.disabled = true; }
        setTimeout(() => {
            const success = processBooking(this);
            if (success) { closeBookingModal(); this.reset(); }
            if (submitBtn) { submitBtn.innerHTML = originalText; submitBtn.disabled = false; }
        }, 500);
    });
    const cancelBtn = newForm.querySelector('button[type="button"]');
    if (cancelBtn && cancelBtn.innerText.includes('Cancel')) {
        cancelBtn.onclick = function(e) { e.preventDefault(); closeBookingModal(); };
    }
}

function adminViewBookings(password) {
    if (password !== 'admin') { showNotification('🔒 Access denied', 'error'); return; }
    const all = getAllBookings();
    if (all.length === 0) { showNotification('No bookings yet', 'error'); return; }
    let html = `<div id="adminModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:4000;"><div style="background:white; max-width:700px; width:90%; max-height:85%; overflow:auto; border-radius:28px; padding:24px;"><div style="display:flex; justify-content:space-between;"><h3>👑 Admin: ${all.length} bookings</h3><button onclick="this.closest('#adminModal').remove()">✖️</button></div>`;
    all.forEach(b => { html += `<div style="border-bottom:1px solid #eee; padding:12px 0;"><strong>${b.tourName}</strong><br>${b.fullName} · ${b.email}<br>${b.date} · ${b.travelers} travelers · ${b.bookedAt}</div>`; });
    html += `<button class="btn" style="margin-top:15px;" onclick="exportBookingsCSV()">📥 Export CSV</button></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}
function exportBookingsCSV() {
    const all = getAllBookings();
    let csv = 'Tour,Full Name,Email,Phone,Travelers,Date,Booked At,Status\n';
    all.forEach(b => { csv += `"${b.tourName}","${b.fullName}","${b.email}","${b.phone}",${b.travelers},"${b.date}","${b.bookedAt}","${b.status}"\n`; });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showNotification('📊 Exported to CSV');
}

document.addEventListener('DOMContentLoaded', () => { setTimeout(() => { initBookingSystem(); }, 100); });
document.addEventListener('keydown', (e) => { if (e.ctrlKey && e.shiftKey && e.key === 'A') { const pwd = prompt('Admin password:'); if (pwd) adminViewBookings(pwd); } });
console.log('bookings.js loaded');