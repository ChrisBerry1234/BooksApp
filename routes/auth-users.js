const express = require('express')
const books = require('./data/books.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const path = require('path')
require('dotenv').config({path: path.resolve(__dirname, 'C:\\Users\\chris\\BooksApp\\.env')})

const auth = express();
const PORT = 3000;

const SECRET_KEY = process.env.INTERNAL_SECRET_KEY;

//Array to hold registered users
let users = [];

//MIDDLEWARE PARSING 
auth.use(express.json())

const authenticateUser = async (user) => {
  const existingUser = users.find(u => u.username === user.username)
  //IF NO USER RETURN
  if (!existingUser) return {"success": false, "message": `No user by the username ${user.username} exists. Please register`}
  //IF USERNAME EXISTS, CHECK AGAINST PASSWORD
  if (await bcrypt.compare(user.password, existingUser.password)){
  return {"success": true, "message":  `User ${existingUser.username} authenticated`}
  }
  else{
    return {"success": false, "message": "Password incorrect"}
  }
}

const addUserReview = (ISBN, username, review) => {
  //FIND USER
  const foundUser = users.find(user => user.username === username)
  if (!foundUser) return {"success": false, "message": "User not found"};
  //IF FOUND USER SEARCH FOR REVIEWS
  //IF USER HAS NO REVIEWS, CREATE A NEW ARRAY TO HOLD USER REVIEWS
  if(!Array.isArray(foundUser.reviews)) foundUser.reviews = [];

  //LOOP THROUGH USER ARRAY OF REVIEWS TO FIND SPECIFIC ISBN TO WHICH WE WANT TO ADD REVIEWS
  const user_review = foundUser.reviews.find(review => review.isbn === ISBN)
  if (user_review){
    //UPDATE THAT REVIEW
    user_review.content = review;
    return {"success": true, "message": "Review updated"};
  }
  //ELSE IF NO ISBN KEY, MAKE A NEW ENTRY FOR THIS REVIEW
  const newReview = {isbn: ISBN, content: review}
  foundUser.reviews.push(newReview)
  return {"success": true, "message": "Review added"};
  }

auth.use('/auth', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
  return res.status(401).json({ message: "User has not been authenticated" });
  }
  const token = authHeader.split(' ')[1] // Assuming Bearer token format
  if (!token) {
    return res.status(401).json({message: "User has not been authenticated"})
  }
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if(err){
      return res.status(403).json({message: "Invalid or expired token"})
    }
    req.user = user;
    next();
  })
})

auth.post('/customer/login', async (req, res)=> {
  //CREATE AN OBJECT FOR USER
  const user = {username: req.body.username, password: req.body.password}
  if (!user.password || !user.username) return res.status(400).json({message:"Please include all required parameters"});
  const result = await authenticateUser(user);
  //IF USER IS AUTHENTICATED
  if (result.success === true){
    const accessToken = jwt.sign({username: user.username}, SECRET_KEY, {expiresIn: '1h'})
    return res.status(200).json({message: `${result.message}`, token: accessToken});
  }
  return res.status(401).json({message: `${result.message}`})
})


//AUTHENTICATED USERS WILL BE ABLE TO POST REVIEWS FOR SPECIFIC BOOK
auth.post('/auth/review/:isbn', async (req, res) => {
  const ISBN = req.params.isbn;
  if(!ISBN) return res.status(400).json({message: "Missing ISBN parameter"});
  //SEARCH FOR BOOK
  if (!books[ISBN]) return res.status(404).json({message: `No book found with ISBN ${ISBN}`});
  //IF BOOK FOUND 
  const review = req.query.review;
  const book_reviews = books[ISBN]['reviews']
  //FIND THE USER
  const username = req.user.username;
  const user_review = book_reviews.find(u => u.user === username);
  if (!user_review){
    const new_review_obj = {user: username, content: review}
    book_reviews.push(new_review_obj)
    addUserReview(ISBN, username, review);
    return res.status(201).json({message: "Review added"});
  }
  else{
    //IF USER ALREADY REVIEWED THE BOOK, UPDATE THE REVIEW
    user_review.content = review;
    return res.status(201).json({message: "Review updated"});
  }
})

auth.get('/auth/debug/users', (req, res) => {
  res.json(users);
});

auth.listen(PORT, () => {
    console.log(`Auth Server is running on port ${PORT}`);
})

module.exports.users = users;