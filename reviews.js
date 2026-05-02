const REVIEWS_STORAGE_KEY = 'belarus_tour_reviews';

function getAllReviews() {
    return JSON.parse(localStorage.getItem(REVIEWS_STORAGE_KEY) || '{}');
}

function getTourReviews(tourId) {
    const all = getAllReviews();
    const key = String(tourId);
    return all[key] || [];
}

function addReview(tourId, review) {
    const all = getAllReviews();
    const key = String(tourId);
    if (!all[key]) all[key] = [];
    all[key].push({
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        author: review.author || 'Anonymous',
        rating: parseInt(review.rating),
        text: review.text,
        date: new Date().toLocaleDateString()
    });
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(all));
}

function getAverageRating(tourId) {
    const reviews = getTourReviews(tourId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
}

function renderStars(rating, size = '14px') {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    let stars = '';
    for (let i = 0; i < full; i++) stars += '<i class="fas fa-star" style="color:#ffc107; font-size:'+size+'"></i>';
    if (half) stars += '<i class="fas fa-star-half-alt" style="color:#ffc107; font-size:'+size+'"></i>';
    for (let i = full + half; i < 5; i++) stars += '<i class="far fa-star" style="color:#ffc107; font-size:'+size+'"></i>';
    return stars;
}

function renderReviewForm(tourId, onSuccess) {
    return `
        <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 20px;">
            <h4>📝 Leave a review</h4>
            <form id="reviewForm_${tourId}" style="display: flex; flex-direction: column; gap: 12px;">
                <input type="text" id="reviewName_${tourId}" placeholder="Your name (optional)" style="padding: 10px; border-radius: 30px; border: 1px solid #ddd;">
                <div style="display: flex; gap: 5px; align-items: center;">
                    <span>Rating:</span>
                    <div id="starSelector_${tourId}" style="display: flex; gap: 5px; cursor: pointer;">
                        <i class="far fa-star" data-rating="1"></i>
                        <i class="far fa-star" data-rating="2"></i>
                        <i class="far fa-star" data-rating="3"></i>
                        <i class="far fa-star" data-rating="4"></i>
                        <i class="far fa-star" data-rating="5"></i>
                    </div>
                    <input type="hidden" id="reviewRating_${tourId}" value="0">
                </div>
                <textarea id="reviewText_${tourId}" rows="3" placeholder="Your comment..." style="padding: 10px; border-radius: 16px; border: 1px solid #ddd;"></textarea>
                <button type="submit" class="btn" style="width: auto; padding: 10px 20px;">Submit review</button>
            </form>
        </div>
    `;
}

function initStarSelector(tourId) {
    const container = document.getElementById(`starSelector_${tourId}`);
    if (!container) return;
    const stars = container.querySelectorAll('i');
    const ratingInput = document.getElementById(`reviewRating_${tourId}`);
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            ratingInput.value = rating;
            stars.forEach((s, idx) => {
                if (idx < rating) {
                    s.className = 'fas fa-star';
                } else {
                    s.className = 'far fa-star';
                }
            });
        });
    });
}

function renderReviewsList(tourId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const reviews = getTourReviews(tourId);
    if (reviews.length === 0) {
        container.innerHTML = '<p>💬 No reviews yet. Be the first to comment!</p>';
        return;
    }
    container.innerHTML = reviews.map(r => `
        <div style="border-bottom: 1px solid #eee; padding: 15px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <strong>${escapeHtml(r.author)}</strong>
                <div>${renderStars(r.rating, '12px')}</div>
                <small style="color:#888;">${r.date}</small>
            </div>
            <p style="margin-top: 8px;">${escapeHtml(r.text)}</p>
        </div>
    `).join('');
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

function attachReviewsToDetail(tourId, isActive = false) {
    const avg = getAverageRating(tourId);
    const ratingHtml = avg > 0 ? `<span style="margin-left: 15px;">${renderStars(avg, '18px')} (${avg})</span>` : '';

    const titleElement = document.querySelector('#tour-detail-page .detail-container h1, #active-detail-page .detail-container h1');
    if (titleElement && !titleElement.querySelector('.rating-stars')) {
        titleElement.insertAdjacentHTML('beforeend', `<span class="rating-stars" style="margin-left: 15px;">${ratingHtml}</span>`);
    }

    const detailContainer = document.querySelector('#tour-detail-page .detail-container, #active-detail-page .detail-container');
    if (detailContainer && !document.getElementById(`reviewsSection_${tourId}`)) {
        const reviewsSection = document.createElement('div');
        reviewsSection.id = `reviewsSection_${tourId}`;
        reviewsSection.innerHTML = `
            <div style="margin-top: 40px;">
                <h3><i class="fas fa-comments"></i> Guest Reviews (${getTourReviews(tourId).length})</h3>
                <div id="reviewsList_${tourId}"></div>
                ${renderReviewForm(tourId, () => {
                    renderReviewsList(tourId, `reviewsList_${tourId}`);
                    const newAvg = getAverageRating(tourId);
                    const newRatingHtml = newAvg > 0 ? `<span style="margin-left: 15px;">${renderStars(newAvg, '18px')} (${newAvg})</span>` : '';
                    const ratingSpan = document.querySelector('#tour-detail-page .detail-container h1 .rating-stars, #active-detail-page .detail-container h1 .rating-stars');
                    if (ratingSpan) ratingSpan.innerHTML = newRatingHtml;
                    const countElem = document.querySelector(`#reviewsSection_${tourId} h3`);
                    if (countElem) countElem.innerHTML = `<i class="fas fa-comments"></i> Guest Reviews (${getTourReviews(tourId).length})`;
                })}
            </div>
        `;
        detailContainer.appendChild(reviewsSection);

        renderReviewsList(tourId, `reviewsList_${tourId}`);
        initStarSelector(tourId);

        const form = document.getElementById(`reviewForm_${tourId}`);
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const author = document.getElementById(`reviewName_${tourId}`).value.trim() || 'Anonymous';
                const rating = parseInt(document.getElementById(`reviewRating_${tourId}`).value);
                const text = document.getElementById(`reviewText_${tourId}`).value.trim();
                if (!rating || rating === 0) {
                    alert('Please select a rating (1-5 stars)');
                    return;
                }
                if (!text) {
                    alert('Please write your comment');
                    return;
                }
                addReview(tourId, { author, rating, text });
                document.getElementById(`reviewName_${tourId}`).value = '';
                document.getElementById(`reviewRating_${tourId}`).value = 0;
                document.getElementById(`reviewText_${tourId}`).value = '';
                const starsSelector = document.querySelectorAll(`#starSelector_${tourId} i`);
                starsSelector.forEach(s => s.className = 'far fa-star');
                renderReviewsList(tourId, `reviewsList_${tourId}`);
                const newAvg = getAverageRating(tourId);
                const newRatingHtml = newAvg > 0 ? `<span style="margin-left: 15px;">${renderStars(newAvg, '18px')} (${newAvg})</span>` : '';
                const ratingSpan = document.querySelector('#tour-detail-page .detail-container h1 .rating-stars, #active-detail-page .detail-container h1 .rating-stars');
                if (ratingSpan) ratingSpan.innerHTML = newRatingHtml;
                const countElem = document.querySelector(`#reviewsSection_${tourId} h3`);
                if (countElem) countElem.innerHTML = `<i class="fas fa-comments"></i> Guest Reviews (${getTourReviews(tourId).length})`;
            });
        }
    }
}

if (typeof window.showTourDetail === 'function') {
    const originalShowTourDetail = window.showTourDetail;
    window.showTourDetail = function(id) {
        originalShowTourDetail(id);
        setTimeout(() => attachReviewsToDetail(id, false), 500);
    };
}
if (typeof window.showActiveDetail === 'function') {
    const originalShowActiveDetail = window.showActiveDetail;
    window.showActiveDetail = function(id) {
        originalShowActiveDetail(id);
        setTimeout(() => attachReviewsToDetail(id, true), 500);
    };
}

console.log('reviews.js loaded – отзывы готовы');