let currentUserEmailMyTours = null;

function showMyToursDashboard() {
    closeMyToursDashboard();

    if (typeof getAllBookings === 'undefined') {
        console.error('getAllBookings is not defined!');
        alert('System error: bookings module not loaded. Please refresh the page.');
        return;
    }
    if (typeof showNotification === 'undefined') {
        window.showNotification = function(msg, type) { alert(msg); };
    }

    if (!currentUserEmailMyTours) {
        const email = prompt('📧 Enter your email to view your tours:');
        if (!email || !email.includes('@')) {
            showNotification('Please enter a valid email', 'error');
            return;
        }
        currentUserEmailMyTours = email.trim().toLowerCase();
    }

    const userBookings = getUserBookings(currentUserEmailMyTours);
    console.log(`Found ${userBookings.length} bookings for ${currentUserEmailMyTours}`);

    const dashboardHtml = `
        <div id="userDashboard" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 20000;
            overflow-y: auto;
            padding: 20px;
            box-sizing: border-box;
        ">
            <div style="
                max-width: 900px;
                margin: 0 auto;
                background: white;
                border-radius: 28px;
                padding: 25px;
                position: relative;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    flex-wrap: wrap;
                    gap: 15px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #c5a059;
                ">
                    <h2><i class="fas fa-suitcase" style="color:#c5a059;"></i> My Tours</h2>
                    <div style="display: flex; gap: 12px;">
                        <span style="margin-right:5px;">👤 ${escapeHtml(currentUserEmailMyTours)}</span>
                        <button class="btn-outline" onclick="logoutMyTours()" style="
                            background: transparent;
                            border: 2px solid #c5a059;
                            color: #c5a059;
                            padding: 6px 16px;
                            border-radius: 40px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        " onmouseover="this.style.backgroundColor='#c5a059'; this.style.color='#001f3f';"
                           onmouseout="this.style.backgroundColor='transparent'; this.style.color='#c5a059';">🚪 Logout</button>
                        <button class="btn-outline" onclick="closeMyToursDashboard()" style="
                            background: transparent;
                            border: 2px solid #c5a059;
                            color: #c5a059;
                            padding: 6px 16px;
                            border-radius: 40px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        " onmouseover="this.style.backgroundColor='#c5a059'; this.style.color='#001f3f';"
                           onmouseout="this.style.backgroundColor='transparent'; this.style.color='#c5a059';">✖️ Close</button>
                    </div>
                </div>
                <h3>My Bookings (${userBookings.length})</h3>
                <div id="userBookingsList">
                    ${userBookings.length === 0 ? '<p style="text-align:center; padding:40px;">📭 No bookings yet. Go book a tour!</p>' : ''}
                    ${userBookings.map(b => `
                        <div style="
                            background: #f8f9fa;
                            border-radius: 20px;
                            padding: 20px;
                            margin-bottom: 15px;
                            transition: all 0.3s;
                            ${b.status === 'cancelled' ? 'opacity: 0.6; background: #ffe0e0;' : ''}
                        " data-id="${b.id}">
                            <h4 style="margin: 0 0 8px 0; color: #001f3f;">🏰 ${escapeHtml(b.tourName)}</h4>
                            <div style="display: flex; flex-wrap: wrap; gap: 20px; margin: 10px 0; font-size: 14px;">
                                <span>📅 ${escapeHtml(b.date)}</span>
                                <span>👥 ${b.travelers} travelers</span>
                                <span>📧 ${escapeHtml(b.email)}</span>
                                ${b.telegram ? `<span>📱 @${escapeHtml(b.telegram)}</span>` : ''}
                            </div>
                            <div><span class="status-badge status-${b.status}">${b.status}</span></div>
                            <div style="display: flex; gap: 12px; margin-top: 15px; flex-wrap: wrap;">
                                ${b.status !== 'cancelled' ? `
                                    <button class="btn-outline" onclick="editMyBooking('${b.id}')" style="
                                        background: transparent;
                                        border: 2px solid #c5a059;
                                        color: #c5a059;
                                        padding: 8px 16px;
                                        border-radius: 40px;
                                        font-weight: 600;
                                        cursor: pointer;
                                    ">✏️ Edit</button>
                                    <button class="btn-outline" onclick="cancelMyBooking('${b.id}')" style="
                                        background: transparent;
                                        border: 2px solid #e74c3c;
                                        color: #e74c3c;
                                        padding: 8px 16px;
                                        border-radius: 40px;
                                        font-weight: 600;
                                        cursor: pointer;
                                    ">❌ Cancel</button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top:30px; text-align:center;">
                    <button class="btn" onclick="bookNewTourFromMyTours()" style="
                        background: #c5a059;
                        color: #001f3f;
                        border: none;
                        padding: 12px 28px;
                        border-radius: 40px;
                        font-weight: 700;
                        cursor: pointer;
                    ">➕ Book New Tour</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', dashboardHtml);
}

window.editMyBooking = function(bookingId) {
    const allBookings = getAllBookings();
    const booking = allBookings.find(b => b.id == bookingId);
    if (!booking || booking.email !== currentUserEmailMyTours) {
        showNotification('Booking not found or access denied', 'error');
        return;
    }
    if (booking.status === 'cancelled') {
        showNotification('Cannot edit a cancelled booking', 'error');
        return;
    }

    const modalHtml = `
        <div id="editUserModal" class="modal-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 30000;
        ">
            <div style="background: white; border-radius: 28px; padding: 30px; max-width: 500px; width: 90%;">
                <h3>✏️ Edit My Booking</h3>
                <form id="editUserForm">
                    <div class="form-group"><label>Full Name</label><input type="text" id="userEditName" value="${escapeHtml(booking.fullName)}" required style="width:100%; padding:10px; border-radius:16px; border:1px solid #ddd;"></div>
                    <div class="form-group"><label>Telegram</label><input type="text" id="userEditTelegram" value="${escapeHtml(booking.telegram || '')}" placeholder="@username" style="width:100%; padding:10px; border-radius:16px; border:1px solid #ddd;"></div>
                    <div class="form-group"><label>Travelers</label><input type="number" id="userEditTravelers" value="${booking.travelers}" min="1" required style="width:100%; padding:10px; border-radius:16px; border:1px solid #ddd;"></div>
                    <div class="form-group"><label>Date</label><input type="date" id="userEditDate" value="${booking.date}" required style="width:100%; padding:10px; border-radius:16px; border:1px solid #ddd;"></div>
                    <div style="display:flex; gap:12px; margin-top:20px;">
                        <button type="submit" class="btn" style="background: #c5a059; color: #001f3f; border: none; padding: 10px 20px; border-radius: 40px; font-weight: 700; cursor: pointer;">Save</button>
                        <button type="button" class="btn-outline" onclick="closeModal()" style="background: transparent; border: 2px solid #c5a059; color: #c5a059; padding: 10px 20px; border-radius: 40px; font-weight: 600; cursor: pointer;">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('editUserForm').addEventListener('submit', (e) => {
        e.preventDefault();
        booking.fullName = document.getElementById('userEditName').value;
        booking.telegram = document.getElementById('userEditTelegram').value.replace('@', '').trim();
        booking.travelers = parseInt(document.getElementById('userEditTravelers').value);
        booking.date = document.getElementById('userEditDate').value;
        saveAllBookings(allBookings);
        closeModal();
        showNotification('✅ Your booking has been updated!', 'success');
        closeMyToursDashboard();
        showMyToursDashboard();
        if (booking.telegram && typeof window.sendTelegramMessage === 'function') {
            window.sendTelegramMessage('@' + booking.telegram, `🔄 Your booking for ${booking.tourName} has been UPDATED!\nNew date: ${booking.date}\nTravelers: ${booking.travelers}`);
        }
    });
};

window.cancelMyBooking = function(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    const allBookings = getAllBookings();
    const booking = allBookings.find(b => b.id == bookingId);
    if (!booking || booking.email !== currentUserEmailMyTours) return;
    if (booking.status === 'cancelled') {
        showNotification('Booking already cancelled', 'error');
        return;
    }
    booking.status = 'cancelled';
    saveAllBookings(allBookings);
    showNotification('❌ Your booking has been cancelled', 'success');
    closeMyToursDashboard();
    showMyToursDashboard();
    if (booking.telegram && typeof window.sendTelegramMessage === 'function') {
        window.sendTelegramMessage('@' + booking.telegram, `❌ Your booking for ${booking.tourName} on ${booking.date} has been CANCELLED.`);
    }
};

window.bookNewTourFromMyTours = function() {
    closeMyToursDashboard();
    document.getElementById('tours-section')?.scrollIntoView({ behavior: 'smooth' });
};

function logoutMyTours() {
    currentUserEmailMyTours = null;
    closeMyToursDashboard();
    showNotification('👋 Logged out successfully', 'success');
}

function closeMyToursDashboard() {
    const el = document.getElementById('userDashboard');
    if (el) el.remove();
}

function closeModal() {
    document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

console.log('user-dashboard.js loaded (no view details button)');