import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import db from './lib/database.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', './views');
app.set('layout', 'layout');
app.use(express.static('public'));

app.get('/', (req, res) => {
    db.query('SELECT * FROM recipes ORDER BY created_at DESC LIMIT 1', (err, results) => {
        if (err) {
            console.error('Error fetching recipe of the month:', err);
            res.status(500).send('Error fetching recipe of the month');
            return;
        }
        const recipeOfTheMonth = results[0];
        res.render('pages/index', { title: 'Home', recipe: recipeOfTheMonth });
    });
});

app.get('/about', (req, res) => {
    res.render('pages/about', { title: 'About Us' });
});

app.get('/recipes', (req, res) => {
    db.query(`
        SELECT 
            r.*, 
            COALESCE(l.likes, 0) AS likes,
            COALESCE(l.dislikes, 0) AS dislikes,
            CASE 
                WHEN (COALESCE(l.likes, 0) + COALESCE(l.dislikes, 0)) = 0 THEN 0
                ELSE (CAST(COALESCE(l.likes, 0) AS DECIMAL) / (COALESCE(l.likes, 0) + COALESCE(l.dislikes, 0)) * 100)
            END AS ratio
        FROM recipes r
        LEFT JOIN likes l ON r.id = l.recipe_id
        ORDER BY ratio DESC
    `, (err, results) => {
        if (err) {
            console.error('SQL Error:', err.sqlMessage);
            console.error('Full Error:', err);
            res.status(500).send('Error fetching recipes');
            return;
        }
        res.render('pages/recipes', { title: 'Recipes', recipes: results });
    });
});

app.get('/recipe/:id', (req, res) => {
    const recipeId = req.params.id;
    db.query('SELECT r.*, l.likes, l.dislikes FROM recipes r LEFT JOIN likes l ON r.id = l.recipe_id WHERE r.id = ?', [recipeId], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching recipe');
            return;
        }
        if (result.length === 0) {
            res.status(404).send('Recipe not found');
            return;
        }

        const recipe = result[0];

        const likes = parseInt(recipe.likes) || 0;
        const dislikes = parseInt(recipe.dislikes) || 0;
        const total = likes + dislikes;
        const ratio = total > 0 ? Math.round((likes / total) * 100) : 0;

        if (!recipe.instructions) recipe.instructions = "No instructions available";
        if (!recipe.ingredients) recipe.ingredients = "No ingredients listed";

        db.query('SELECT * FROM comments WHERE recipe_id = ? ORDER BY created_at DESC', [recipeId], (err, commentsResult) => {
            if (err) {
                res.status(500).send('Error fetching comments');
                return;
            }

            res.render('pages/recipe', {
                title: recipe.title,
                recipe: {
                    ...recipe,
                    likes: likes,
                    dislikes: dislikes
                },
                comments: commentsResult,
                ratio: ratio
            });
        });
    });
});

app.post('/recipe/:id/comments', (req, res) => {
    const recipeId = req.params.id;
    const { comment } = req.body;

    db.query('INSERT INTO comments (recipe_id, comment) VALUES (?, ?)', [recipeId, comment], (err, result) => {
        if (err) {
            console.error('Error inserting new comment:', err);
            res.status(500).send('Error inserting new comment');
            return;
        }
        res.redirect(`/recipe/${recipeId}`);
    });
});

app.get('/newRecipe', (req, res) => {
    res.render('pages/newRecipe', { title: 'Create New Recipe' });
});

app.post('/recipes', (req, res) => {
    const { title, image, content, ingredients, instructions } = req.body;

    db.query('INSERT INTO recipes (title, image, content, ingredients, instructions) VALUES (?, ?, ?, ?, ?)',
        [title, image, content, ingredients, instructions], (err, result) => {
            if (err) {
                console.error('Error inserting new recipe:', err);
                res.status(500).send('Error inserting new recipe');
                return;
            }
            res.redirect('/recipes');
        });
});

app.post('/api/likes', (req, res) => {
    const { recipeId, isLike } = req.body;

    if (!recipeId || typeof isLike !== 'boolean') {
        return res.status(400).send('Invalid request');
    }

    db.query(`
        INSERT INTO likes (recipe_id, likes, dislikes)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            likes = likes + VALUES(likes),
            dislikes = dislikes + VALUES(dislikes)
    `, [
        recipeId,
        isLike ? 1 : 0,
        isLike ? 0 : 1
    ], (err) => {
        if (err) {
            console.error('Update error:', err);
            return res.status(500).send('Error updating likes');
        }
        res.sendStatus(200);
    });
});

app.get('/api/recipes/:id/likes', (req, res) => {
    const recipeId = req.params.id;
    db.query('SELECT likes, dislikes FROM likes WHERE recipe_id = ?', [recipeId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({
            likes: results[0]?.likes || 0,
            dislikes: results[0]?.dislikes || 0
        });
    });
});

app.get('/search', (req, res) => {
    const searchTerm = req.query.q;
    if (!searchTerm) {
        return res.status(400).send('Search term is required');
    }

    db.query('SELECT id, title, image FROM recipes WHERE title LIKE ?', [`%${searchTerm}%`], (err, results) => {
        if (err) {
            console.error('Error fetching search results:', err);
            return res.status(500).send('Error fetching search results');
        }
        res.json(results);
    });
});

app.get('/impressum', (req, res) => {
    res.render('pages/impressum', { title: 'Impressum' });
});

app.listen(4000, () => {
    console.log(`Server running on localhost:4000`);
});