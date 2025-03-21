document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        if (query.length > 0) {
            fetch(`/search?q=${query}`)
                .then(response => response.json())
                .then(results => {
                    searchResults.innerHTML = '';
                    if (results.length > 0) {
                        results.forEach(result => {
                            const item = document.createElement('div');
                            item.classList.add('result-item');
                            item.innerHTML = `
                                <img src="${result.image}" alt="${result.title}">
                                <span>${result.title}</span>
                            `;
                            item.addEventListener('click', () => {
                                window.location.href = `/recipe/${result.id}`;
                            });
                            searchResults.appendChild(item);
                        });
                        searchResults.style.display = 'block';
                    } else {
                        searchResults.style.display = 'none';
                    }
                })
                .catch(error => {
                    console.error('Error fetching search results:', error);
                    searchResults.style.display = 'none';
                });
        } else {
            searchResults.style.display = 'none';
        }
    });

    document.addEventListener('click', (event) => {
        if (!searchInput.contains(event.target) && !searchResults.contains(event.target)) {
            searchResults.style.display = 'none';
        }
    });
});