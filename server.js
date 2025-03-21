import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import db from './lib/database.js';

const app = express();

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
    db.query('SELECT * FROM recipes', (err, results) => {
        if (err) {
            console.error(err);
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

app.post('/api/likes', (req,res)=>{
    const {recipe} = req.body;
})

app.listen(4000, () => {
    console.log(`Server running on localhost:4000`);
});

