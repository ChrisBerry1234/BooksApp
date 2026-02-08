const express = require('express')
const books = require('./data/books.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const path = require('path')
require('dotenv').config({path: path.resolve(__dirname, 'C:\\Users\\chris\\BooksApp\\.env')})

const auth = express();
const PORT = 3000;

const SECRET_KEY = process.env.INTERNAL_SECRET_KEY;
const REFRESH_SECRET_KEY = process.env.INTERNAL_REFRESH_TOKEN_SECRET_KEY;

//Array to hold registered users
let users = []; //DEVELOPMENT ENVIORNMENT 
let refreshTokens = [];
let activeAccessTokens = []

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

  const reviews = foundUser.reviews 

  //LOOP THROUGH USER ARRAY OF REVIEWS TO FIND SPECIFIC ISBN TO WHICH WE WANT TO ADD REVIEWS
  const user_review = reviews.find(review => review.isbn === ISBN)
  //UPDATE THAT REVIEW
  if(user_review){
    user_review.content = review;
    return {"success": true, "message": "Review updated"};
  }
  else{
    const newReview = {isbn: ISBN, content: review}
    foundUser.reviews.push(newReview)
    return {"success": true, "message": "Review added"};
  }
}

//AUTH MIDDLEWARE
const verify = (req, res, next) => {

  const authHeader = req.headers.authorization;
  if (!authHeader) {
  return res.status(401).json({ message: "User has not been authenticated" });
  }
  const token = authHeader.split(' ')[1] // Assuming Bearer token format
  if (!token) {
    return res.status(401).json({message: "User has not been authenticated"})
  }
  if (!activeAccessTokens.includes(token)) {
    return res.status(403).json({message: "Invalid access token"})
  }
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if(err){
      return res.status(403).json({message: "Invalid or expired token"})
    }
    req.user = user;
    next();
  })
}

auth.post('/customer/login', async (req, res)=> {
  //CREATE AN OBJECT FOR USER
  const user = {username: req.body.username, password: req.body.password}
  if (!user.password || !user.username) return res.status(400).json({message:"Please include all required parameters"});
  const result = await authenticateUser(user);
  //IF USER IS AUTHENTICATED
  if (result.success === true){
    const accessToken = jwt.sign({username: user.username}, SECRET_KEY, {expiresIn: '10min'})
    const refreshToken = jwt.sign({username: user.username}, REFRESH_SECRET_KEY, {expiresIn: '7d'})
    activeAccessTokens.push(accessToken);
    refreshTokens.push(refreshToken);
    return res.status(200).json({message: `${result.message}`, token: accessToken, refreshToken: refreshToken});
  }
  return res.status(401).json({message: `${result.message}`})
})

//AUTHENTICATED USERS WILL BE ABLE TO POST REVIEWS FOR SPECIFIC BOOK
auth.post('/auth/review/:isbn', verify, async (req, res) => {
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

auth.get('/auth/debug/users', verify, (req, res) => {
  res.json(users);
});

auth.post('/auth/token', (req, res) => {
  //GRAB REFRESH TOKEN FROM BODY THAT WAS SENT UPON USER AUTHENTICATION
  const prevAccessToken = req.headers.authorization.split(' ')[1];
  const refreshToken = req.body.token;
  if (!refreshToken) return res.status(401).json({message: "No refresh token"})
  //CHECK IF REFRESH TOKEN IS VALID
  if (!refreshTokens.includes(refreshToken)) return res.status(403).json({message: "Invalid refresh token"})
  //IF REFRESH TOKEN VALID, THEN VERIFY IT AND CREATE NEW ACCESS TOKEN
  jwt.verify(refreshToken, REFRESH_SECRET_KEY, (err, user) => {
    if(err){
      return res.status(403).json({message: "Invalid or expired refresh token"})
    }
  //ASSIGN THE VALID REFRESH TOKEN AS THE NEWLY ACCESS TOKEN AND ASSIGN IN SO USER CAN USE FOR NEW REQUEST
  const newAccessToken = jwt.sign({username: user.username}, SECRET_KEY, {expiresIn: '10min'})
  const newrefreshToken = jwt.sign({username: user.username}, REFRESH_SECRET_KEY, {expiresIn: '7d'})
  activeAccessTokens = activeAccessTokens.filter(token => token !== prevAccessToken);
  activeAccessTokens.push(newAccessToken);
  refreshTokens.push(newrefreshToken);
  return res.status(200).json({accessToken: newAccessToken, refreshToken: newrefreshToken})
})
})

//PREVENT USER FROM CONSTANTLY USING REFRESH TOKENS
auth.delete('/auth/logout', (req, res) => {
  //DELETING REFRESH TOKENS AND CREATING A NEW ARRAY NOT INCLUDING THE REFRESH TOKEN 
  const refreshToken = req.body.token;
  const accessToken = req.headers.authorization.split(' ')[1];
  //
  refreshTokens = refreshTokens.filter(token => token !== refreshToken)
  activeAccessTokens = activeAccessTokens.filter(token => token !== accessToken)
  //USER CAN NO LONGER USE REFRESH TOKEN TO ACCESS THE APPLICATION
  return res.status(200).json({message: "Logged out successfully"})
})


auth.listen(PORT, () => {
    console.log(`Auth Server is running on port ${PORT}`);
})

module.exports.users = users;