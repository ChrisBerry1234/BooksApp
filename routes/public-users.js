const express = require('express')
const books = require('./data/books.js')

const public_users = express()

//GET ALL BOOKs
public_users.get('/', (req, res)=> {
    res.json(books)
})

//GET BOOK BY AUTHOR
public_users.get('/author/:author', (req, res) => {
    const author = req.params.author;
    //AN AUTHOR CAN HAVE MULTIPLE BOOKS SO WE WANT AN ARRAY 
    const filteredBooks = books.filter(book => book.author === author);
    if (filteredBooks.length > 0) {
        return res.json(filteredBooks)
    }
    return res.json({message: `No books found by author ${author}`});
})

//GET BOOK BY ISBN
public_users.get('/isbn/:isbn', (req,res)=> {
    const ISBN = req.params.isbn;
    //ISBN IS SPECIFIC SO WE WANT ONE ELEMENT 
    const book = books.find(book.id)
    
})

module.exports = public_users;