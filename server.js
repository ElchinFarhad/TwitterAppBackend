
//create app
var express = require("express")
var app = express();

//database
const dao = require('./database.js');

//server port
var HTTP_PORT=8000;

//start server
app.listen(HTTP_PORT, ()=> {
    console.log("Server running in port "+ HTTP_PORT)
})

// Process body content
app.use(express.json());
const jwtSecret = '5amL4MARAbG49hcXf5GIYASvkDICiUAR6EDrZBR5dLdwW7hMzUjjMUe9t6M5kSAYVEL';
const expireTime = 300; //seconds

// Authorization error
const authErrorObj = { errors: [{  'param': 'Server', 'msg': 'Authorization error' }] };

const jwt = require('express-jwt');
const jsonwebtoken = require('jsonwebtoken');
const cookieParser = require('cookie-parser');


//API

//Register new user 
app.post("/api/register", (req, res)=>{
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    dao.registerUser(username, email, password).then( (ok) => {
        res.status(200).send("USER REGISTERED");
      }).catch( error => {
        if (error) {
            res.status(400).json(error);
          }
      })
})



// LOGIN
app.post('/api/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
  
    dao.getUser(username)
      .then((user) => {
  
        if(user === undefined) {
            res.status(409).send({
                errors: [{ 'param': 'Server', 'msg': 'Invalid username' }] 
              });
        } else {
            if(!dao.checkPassword(user, password)){
                res.status(401).send({
                    errors: [{ 'param': 'Server', 'msg': 'Wrong password' }] 
                  });
            } else {
                //AUTHENTICATION SUCCESS
                const token = jsonwebtoken.sign({ id: user.id }, jwtSecret, {expiresIn: expireTime});
                res.cookie('token', token, { httpOnly: true, sameSite: true, maxAge: 1000*expireTime });
                res.json(user);
            }
        } 
      }).catch(
        // Delay response when wrong user/pass is sent to avoid fast guessing attempts
        (err) => {
            new Promise((resolve) => {setTimeout(resolve, 1000)}).then(() => res.status(401).json(authErrorObj))
        }
      );
  });


//Authorization
app.use(cookieParser());

app.use(
    jwt({
      secret: jwtSecret,
      algorithms: ['HS256'],
      getToken: req => req.cookies.token
    })
  );

  app.post('/api/logout', (req, res) => {
    res.clearCookie('token').end();
});


//Get list of users
app.get('/api/listUsers', (req, res) => {
    dao
      .listUsers()
      .then((list) =>   
       res.json(list))
      .catch(() =>  res.status(500).end("request failed"))
  });



//Follow User
app.post('/api/followUser/', (req, res) => {
    const id=req.user && req.user.id;
    const follId=req.body.id;
    dao
      .followUser(id, follId)
      .then((ok) =>   
       res.json.end({msg: "User followed"}))
      .catch((err) =>  res.status(500).json.end({msg: err}))
  });


//UnFollow User
app.delete('/api/unFollowUser/', (req, res) => {
    const id=req.user && req.user.id;
    const follId=req.body.id;
    dao
      .unFollowUser(id, follId)
      .then((ok) =>   
       res.json.end({msg:"User unFollowed"}))
      .catch(() =>  res.status(500).json.end("request failed"))
  });


//Get list of followed users
app.get('/api/followedUsers', (req, res) => {
    const id=req.user && req.user.id;
    dao
      .followedListUsers(id)
      .then((list) =>   
       res.json(list))
      .catch(() =>  res.status(500).end("request failed"))
  });


//Post messages
app.post('/api/postMessage/', (req, res) => {
    const id=req.user && req.user.id;
    const message=req.body.message;
    const date=Date();
    dao
      .postMessage(id, message, date)
      .then((ok) =>   
       res.end("Posted"))
      .catch(() =>  res.status(500).end("request failed"))
  });


//Get list of posts
app.get('/api/posts/', (req, res) => {
    const id=req.user && req.user.id;
    dao
      .getPosts(id)
      .then((list) =>   
       res.json(list))
      .catch(() =>  res.status(500).end("request failed"))
  });