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
    const filteredBooks = [];

    //Object.entries will return an array of a given. We can use array methods
    Object.entries(books).forEach(([key, book]) => {
        if (book['author'] === author){
            filteredBooks.push(book);
        }
    })

    if (filteredBooks.length === 0) {
        return res.status(404).json({message: `No books found by author ${author}`})
    }
    if (filteredBooks.length > 1) {
        return res.status(200).json(filteredBooks);
    }
    return res.status(200).json(filteredBooks[0]);
})

//GET BOOK BY ISBN
public_users.get('/isbn/:isbn', (req,res)=> {
    const ISBN = req.params.isbn;
    //ISBN IS SPECIFIC SO WE WANT ONE ELEMENT 
    if (books[ISBN]) return res.status(200).json(books[ISBN]);

    return res.status(404).json({message: `No book found with ISBN ${ISBN}`})
    
})

//GET BOOKS BASED ON TITLE
public_users.get('/title/:title', (req, res) => {
    const {title} = req.params;

    const found_book = Object.values(books).find(book => book['title'] === title);

    if (found_book) {
        return res.status(200).json(`The book ${title} with Author  ${found_book['author']} has been found`);
    }
    return res.status(404).json({message: `No book found with title ${title}`});
})

//GET REVIEWS ON BOOKS
public_users.get('/review/:isbn', (req, res) => {
    const ISBN = req.params.isbn;
    if (!ISBN) return res.status(400).json({message: "Missing ISBN parameter"});
    //DECIDED TO CREATE A ARRAY TO HOLD REVIEWS TO SEE IF THERE ARE ANY REVIEWS IN THE FIRST PLACE
    const reviews = []
    if (books[ISBN]){
        books[ISBN]['reviews'].forEach(review => {
            reviews.push(review);
        })
    }
    if (reviews.length === 0) return res.status(404).json({message: `No reviews found for ISBN ${ISBN} or book by the name of ${books[ISBN]['title']}`});

    return res.status(200).json(reviews);
})

module.exports = public_users;