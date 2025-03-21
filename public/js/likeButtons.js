async function fetchInitialCounts() {
    try {
        const response = await fetch('/api/getLikeCounts');
        if (!response.ok) {
            throw new Error('Failed to fetch initial counts');
        }
        const data = await response.json();
        document.getElementById('likeCount').textContent = data.likes;
        document.getElementById('dislikeCount').textContent = data.dislikes;
    } catch (error) {
        console.error('Error fetching initial counts:', error);
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', fetchInitialCounts);

async function updateLikes(isLike) {
    const action = isLike ? 'like' : 'dislike';
    const countElement = isLike ? document.getElementById('likeCount') : document.getElementById('dislikeCount');
    
    // Optimistically update the UI
    const currentCount = parseInt(countElement.textContent);
    countElement.textContent = currentCount + 1;

    try {
        const response = await fetch('/api/updateLikes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: action }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        // Update the UI with the actual count from the database
        countElement.textContent = data.newCount;
    } catch (error) {
        console.error('Error:', error);
        // Revert the optimistic update
        countElement.textContent = currentCount;
        alert('Failed to update. Please try again.');
    }
}
