const express = require('express');
const public_users = require('./routes/public-users')

const app = express();
const PORT = 5000;

app.use(express.json());

app.use('/books', public_users);

app.listen(PORT, () => {
    console.log(`Server is listening on PORT: ${PORT}`)
})
