document.addEventListener('DOMContentLoaded', () => {
    const likeButton = document.getElementById('likeButton');
    const dislikeButton = document.getElementById('dislikeButton');

    likeButton.addEventListener('click', () => handleReaction(true));
    dislikeButton.addEventListener('click', () => handleReaction(false));
});

function handleReaction(isLike) {
    const recipeId = window.location.pathname.split('/').pop();

    fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, isLike })
    })
        .then(response => {
            if (response.ok) {
                updateCounts(isLike);
                return fetch(`/api/recipes/${recipeId}/likes`);
            }
            throw new Error('Update failed');
        })
        .catch(error => console.error('Error:', error));
}

function updateCounts(isLike) {
    const likeCount = document.getElementById('likeCount');
    const dislikeCount = document.getElementById('dislikeCount');

    if (isLike) {
        likeCount.textContent = parseInt(likeCount.textContent) + 1;
    } else {
        dislikeCount.textContent = parseInt(dislikeCount.textContent) + 1;
    }
}