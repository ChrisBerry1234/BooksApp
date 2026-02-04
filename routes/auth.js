const express = require('express')
const books = require('./data/books.js')
const bcrypt = require('bcrypt')

const auth = express();
const PORT = 3000;

//Array to hold registered users
let users = [];

const authenticateUser = async (user) => {
  const existingUser = users.find(u => u.username === user.username)
  //IF NO USER RETURN
  if ()

}

auth.post('/login', (req, res)=> {
 
//Create an object of User
const users = {username: req.body.username, password: req.body.password}

})


app.listen(PORT, () => {
    console.log(`Auth Server is running on port ${PORT}`);
})