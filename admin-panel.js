const ADMIN_PASSWORD = 'admin';

function showAdminPanel() {
    const existingPanel = document.getElementById('adminPanel');
    if (existingPanel) existingPanel.remove();

    const allBookings = getAllBookings();
    const panelHtml = `
        <div id="adminPanel" class="admin-panel">
            <div class="admin-container">
                <div class="admin-header">
                    <h2><i class="fas fa-crown" style="color:#c5a059;"></i> Admin Dashboard</h2>
                    <div class="admin-actions">
                        <button class="btn-outline" onclick="exportAllBookingsAdmin()">📥 Export CSV</button>
                        <button class="btn-outline" onclick="closeAdminPanel()">✖️ Exit</button>
                    </div>
                </div>
                <div class="admin-section">
                    <h3><i class="fas fa-calendar-check"></i> All Bookings (${allBookings.length})</h3>
                    <div class="bookings-table">${renderBookingsTable(allBookings)}</div>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', panelHtml);
}

function renderBookingsTable(bookings) {
    if (!bookings.length) return '<div class="empty-state">📭 No bookings yet</div>';
    return `
        <table class="admin-bookings-table">
            <thead>
                <tr><th>Tour</th><th>Customer</th><th>Date</th><th>Travelers</th><th>Telegram</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
                ${bookings.map(b => `
                    <tr>
                        <td data-label="Tour"><strong>${escapeHtml(b.tourName)}</strong></td>
                        <td data-label="Customer">${escapeHtml(b.fullName)}<br><small>${escapeHtml(b.email)}</small></td>
                        <td data-label="Date">${escapeHtml(b.date)}</td>
                        <td data-label="Travelers">${b.travelers}</td>
                        <td data-label="Telegram">${b.telegram ? '@' + escapeHtml(b.telegram) : '-'}</td>
                        <td data-label="Status"><span class="status-badge status-${b.status}">${b.status}</span></td>
                        <td data-label="Actions" class="admin-buttons">
                            <select onchange="updateBookingStatusAdmin('${b.id}', this.value)">
                                <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirm</option>
                                <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancel</option>
                            </select>
                            <button class="edit-btn" onclick="editBookingAdmin('${b.id}')">✏️ Edit</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
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

window.updateBookingStatusAdmin = function(bookingId, newStatus) {
    const all = getAllBookings();
    const booking = all.find(b => b.id == bookingId);
    if (booking) {
        booking.status = newStatus;
        saveAllBookings(all);
        showNotification(`✅ Status changed to ${newStatus}`, 'success');
        if (booking.telegram && window.sendTelegramMessage) {
            window.sendTelegramMessage('@' + booking.telegram, `🔄 Your booking for ${booking.tourName} status: ${newStatus.toUpperCase()}`);
        }
        showAdminPanel();
    }
};

window.editBookingAdmin = function(bookingId) {
    const all = getAllBookings();
    const booking = all.find(b => b.id == bookingId);
    if (!booking) return;
    const modalHtml = `
        <div id="editBookingModal" class="modal-overlay">
            <div class="modal-content">
                <h3>✏️ Edit Booking</h3>
                <form id="editBookingFormAdmin">
                    <div class="form-group"><label>Full Name</label><input type="text" id="editName" value="${escapeHtml(booking.fullName)}" required></div>
                    <div class="form-group"><label>Email</label><input type="email" id="editEmail" value="${escapeHtml(booking.email)}" required></div>
                    <div class="form-group"><label>Telegram</label><input type="text" id="editTelegram" value="${escapeHtml(booking.telegram || '')}" placeholder="@username"></div>
                    <div class="form-group"><label>Travelers</label><input type="number" id="editTravelers" value="${booking.travelers}" min="1" required></div>
                    <div class="form-group"><label>Date</label><input type="date" id="editDate" value="${booking.date}" required></div>
                    <div class="form-group"><label>Status</label>
                        <select id="editStatus">
                            <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    <div class="modal-buttons">
                        <button type="submit" class="btn">Save</button>
                        <button type="button" class="btn-outline" onclick="closeModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('editBookingFormAdmin').addEventListener('submit', (e) => {
        e.preventDefault();
        booking.fullName = document.getElementById('editName').value;
        booking.email = document.getElementById('editEmail').value;
        booking.telegram = document.getElementById('editTelegram').value.replace('@', '').trim();
        booking.travelers = parseInt(document.getElementById('editTravelers').value);
        booking.date = document.getElementById('editDate').value;
        booking.status = document.getElementById('editStatus').value;
        saveAllBookings(all);
        closeModal();
        showNotification('✅ Booking updated!', 'success');
        showAdminPanel();
    });
};

window.exportAllBookingsAdmin = function() {
    const all = getAllBookings();
    if (all.length === 0) { showNotification('No bookings to export', 'error'); return; }
    let csv = 'ID,Tour,Full Name,Email,Telegram,Travelers,Date,Booked At,Status\n';
    all.forEach(b => {
        csv += `"${b.id}","${b.tourName}","${b.fullName}","${b.email}","${b.telegram || ''}",${b.travelers},"${b.date}","${b.bookedAt}","${b.status}"\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showNotification('📊 Exported to CSV', 'success');
};

function closeModal() { document.querySelectorAll('.modal-overlay').forEach(el => el.remove()); }
function closeAdminPanel() { document.getElementById('adminPanel')?.remove(); }

function addAdminFooterButton() {
    const footerSocial = document.querySelector('.footer .social-icons')?.parentNode;
    if (footerSocial && !document.querySelector('.admin-footer-btn')) {
        const btn = document.createElement('div');
        btn.className = 'admin-footer-btn';
        btn.innerHTML = '<i class="fas fa-shield-alt"></i> Admin Access';
        btn.onclick = () => {
            const pwd = prompt('🔐 Admin password:');
            if (pwd === ADMIN_PASSWORD) showAdminPanel();
            else if (pwd) alert('Wrong password!');
        };
        footerSocial.appendChild(btn);
    }
}

document.addEventListener('DOMContentLoaded', () => { setTimeout(() => { addAdminFooterButton(); }, 1000); });