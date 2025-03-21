import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import db from './lib/database.js';

const app = express();

app.use(express.json());
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', './views');
app.set('layout', 'layout');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('pages/index', { title: 'Home' });
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
            console.error('SQL Error:', err.sqlMessage); // Add this line
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

        db.query('SELECT * FROM comments WHERE recipe_id = ? ORDER BY created_at DESC', [recipeId], (err, commentsResult) => {
            if (err) {
                res.status(500).send('Error fetching comments');
                return;
            }

            res.render('pages/recipe', {
                title: result[0].title,
                recipe: result[0],
                comments: commentsResult
            });
        });
    });
});

app.post('/api/likes', (req, res) => {
    const { recipeId, isLike } = req.body; // Changed from 'recipe' to 'recipeId'

    if (!recipeId || typeof isLike !== 'boolean') {
        return res.status(400).send('Invalid request');
    }

    // Update the SQL query to properly increment counts
    db.query(`
        INSERT INTO likes (recipe_id, likes, dislikes)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            likes = likes + VALUES(likes),
            dislikes = dislikes + VALUES(dislikes)
    `, [
        recipeId,
        isLike ? 1 : 0,  // Insert 1 in likes column if like
        isLike ? 0 : 1   // Insert 1 in dislikes column if dislike
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

app.listen(4000, () => {
    console.log(`Server running on localhost:4000`);
});

