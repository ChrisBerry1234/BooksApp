const express = require('express')
const books = require('./data/books.js')

const app = express();
const PORT = 3000;

app.get('/books', (req, res) => {
  res.json(books);
});

app.listen(PORT, () => {
    console.log(`Auth Server is running on port ${PORT}`);
})