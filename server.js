
//create app
var express = require("express")
var app = express();
var validator = require("email-validator");

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
const authErrorObj = { errors: [{  code: 401, 'msg': 'Authorization error' }] };

const jwt = require('express-jwt');
const jsonwebtoken = require('jsonwebtoken');
const cookieParser = require('cookie-parser');


////////////////////////////////////

//API

//Register new user 
app.post("/api/register", (req, res)=>{
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

  if (Object.keys(req.body).length === 0) {
      res.status(400).json({errors:[{code: 400, msg: "Request body is empty" }]})
   }
   else if(!username || !email|| !password) {
    res.status(409).json({errors:[{code: 409, msg: "Missing parameter" }]})
  }
  else if(!validator.validate(email)) {
    res.status(410).json({errors:[{code: 411, msg: "Not valid email" }]})
  }
  else if(password.length<6) {
    res.status(410).json({errors:[{code: 410, msg: "Not valid password" }]})
  }
   else{ 
    dao.registerUser(username, email, password).then( (ok) => {
        res.status(200).json({code: 200, msg:"USER REGISTERED"});
      }).catch( error => {
        if (error) {
            res.status(422).json({errors:[{code: 422, msg: error }]});
          }
      })
   }
})

//Admin Login
app.post('/api/admin', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

if (Object.keys(req.body).length === 0) {
    res.status(400).json({errors:[{code: 400, msg: "Request body is empty" }]})
 }
 else if(!username || !password) {
  res.status(409).json({errors:[{code: 409, msg: "Missing parameter" }]})
}
 else{ 
  dao.getAdmin(username)
    .then((user) => {
      if(user === undefined) {
          res.status(409).send({
              errors: [{ code: 409, 'msg': 'Invalid username' }] 
            });
      } else {
          if(!dao.checkPassword(user, password)){
              res.status(401).send({
                  errors: [{ code: 401, 'msg': 'Wrong password' }] 
                });
          } else {
              //AUTHENTICATION SUCCESS
              const token = jsonwebtoken.sign({ id: user.id }, jwtSecret, {expiresIn: expireTime});
              res.cookie('token', token, { httpOnly: true, sameSite: true, maxAge: 1000*expireTime });
              res.json(user);
              res.redirect('/admin.html');
          }
      } 
    }).catch(
      // Delay response when wrong user/pass is sent to avoid fast guessing attempts
      (err) => {
          new Promise((resolve) => {setTimeout(resolve, 1000)}).then(() => res.status(401).json({msg:authErrorObj}))
      }
    );
  }
});

// LOGIN
app.post('/api/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

  if (Object.keys(req.body).length === 0) {
      res.status(400).json({errors:[{code: 400, msg: "Request body is empty" }]})
   }
   else if(!username || !password) {
    res.status(409).json({errors:[{code: 409, msg: "Missing parameter" }]})
  }
   else{ 

    dao.getUser(username)
      .then((user) => {
  
        if(user === undefined) {
            res.status(409).send({
                errors: [{ code: 409, 'msg': 'Invalid username' }] 
              });
        } else {
            if(!dao.checkPassword(user, password)){
                res.status(401).send({
                    errors: [{ code: 401, 'msg': 'Wrong password' }] 
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
          console.log("error auth")
            new Promise((resolve) => {setTimeout(resolve, 1000)}).then(() => res.status(401).json({msg:authErrorObj}))
        }
      );
    }
  });


//Authorization
app.use(cookieParser());

app.use(
  jwt({
    secret: jwtSecret,
    algorithms: ['HS256'],
    getToken: req => req.cookies.token
  }),
);

app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send({errors: [{code: 401, msg: 'Unauthorized Error'}]});
  }
});



// Log out
app.post('/api/logout', (req, res) => {
    res.clearCookie('token').json({code: 200, msg: "Logged out"}).end();
});


//Get list of users
app.get('/api/listUsers', (req, res) => {
    dao
      .listUsers()
      .then((list) =>   
       res.json(list))
      .catch(() =>  res.status(500).json({error:[{code: 500, msg: "Request failed"}]}))
  });



//Follow User
app.post('/api/followUser/', (req, res) => {
    const id=req.user && req.user.id;
    const follId=req.body.id;



   if (Object.keys(req.body).length === 0) {
    res.status(400).json({errors:[{code: 400, msg: "Request body is empty" }]})
  }
   else{ 
    dao
      .followUser(id, follId)
      .then((ok) =>   
       res.json({code: 200, msg: "User followed"}))
       .catch((err) =>  res.status(500).json({error:[{code: 500, msg: err}]}))
   }
});


//UnFollow User
app.delete('/api/unFollowUser/', (req, res) => {
    const id=req.user && req.user.id;
    const follId=req.body.id;

  if (Object.keys(req.body).length === 0) {
    res.status(400).json({errors:[{code: 400, msg: "Request body is empty" }]})
  }
 else{ 
    dao
      .unFollowUser(id, follId)
      .then((ok) =>   
       res.json({code: 200, msg:"User unFollowed"}))
       .catch((err) =>  res.status(500).json({error:[{code: 500, msg: err}]}))
      }
});


//Get list of followed users
app.get('/api/followedUsers', (req, res) => {
    const id=req.user && req.user.id;
    dao
      .followedListUsers(id)
      .then((list) =>   
       res.json(list))
       .catch(() =>  res.status(500).json({error:[{code: 500, msg: "Request failed"}]}))
      });


//Post messages
app.post('/api/postMessage/', (req, res) => {
    const id=req.user && req.user.id;
    const message=req.body.message;
    const date=Date();

    if (Object.keys(req.body).length === 0) {
      res.status(400).json({errors:[{code: 400, msg: "Request body is empty" }]})
   }
   else{ 
    dao
      .postMessage(id, message, date)
      .then((ok) =>   
       res.json({code: 200, msg: "Posted" }))
       .catch(() =>  res.status(500).json({error:[{code: 500, msg: "Request failed"}]}))
      }
});


//Get list of posts
app.get('/api/posts/', (req, res) => {
    const id=req.user && req.user.id;
    dao
      .getPosts(id)
      .then((list) =>   
       res.json(list))
       .catch(() =>  res.status(500).json({error:[{code: 500, msg: "Request failed"}]}))
      });


//Get post details
app.get('/api/postDetail/:postId', (req, res) => {
  const id=req.params.postId;
  dao
    .getPostDetails(id)
    .then((list) =>   
     res.json(list))
     .catch((err) =>  res.status(500).json({error:[{code: 500, msg: err}]}))
    });


//Add comment
app.post('/api/addcomment/', (req, res) => {
  const id=req.user && req.user.id; //take id from co
  const postId=req.body.postId;
  const comment=req.body.comment;
  const date=Date();

  if (Object.keys(req.body).length === 0) {
    res.status(400).json({errors:[{code: 400, msg: "Request body is empty" }]})
  }
  else if(!postId || !comment) {
    res.status(409).json({errors:[{code: 409, msg: "Missing parameter" }]})
  }
 else{
  dao
    .addComment(id, postId, comment, date)
    .then((ok) =>   
     res.json({code: 200, msg: "Commented" }))
     .catch((err) =>  res.status(500).json({error:[{code: 500, msg: err}]}))
    }
});


//Delete Comment
app.delete('/api/deleteComment/', (req, res) => {
  const id=req.user && req.user.id;
  const postId=req.body.postId;
  const commentId=req.body.commentId;

if (Object.keys(req.body).length === 0) {
  res.status(400).json({errors:[{code: 400, msg: "Request body is empty" }]})
}
else if(!postId || !commentId) {
  res.status(409).json({errors:[{code: 409, msg: "Missing parameter" }]})
}
else{ 
  dao
    .deleteComment(id, postId, commentId)
    .then((ok) =>   
     res.json({code: 200, msg:"Comment deleted"}))
     .catch((err) =>  res.status(500).json({error:[{code: 500, msg: err}]}))
    }
});