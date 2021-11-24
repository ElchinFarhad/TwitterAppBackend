
const User = require('./user');

//database 
var sqlite3=require("sqlite3")
const db = new sqlite3.Database('./db/test.db', (err) => {
});
const bcrypt = require("bcrypt");

const createUser = function (row) {
    const id = row.id;
    const username = row.username;
    const email = row.email;
    const hash = row.password;
    return new User(id, username, email, hash);
  }


//Register new user
exports.registerUser=function(username, email, password){
    let hashedPassword = bcrypt.hashSync(password, 10);
    return new Promise((resolve, reject)=>{
        const sql='select * from user where username=?'
        db.all(sql, [username], (err,rows) => {
            if(err){
                reject(err);
            }
            else{
                if(rows.length>0){
                    reject("User exist");
                }
                else{
                    const sql='insert into user(username, email, password) values(?,?,?)'
                    db.run(sql, [username, email, hashedPassword], (err) => {
                        if(err){
                            reject(err);
                        }
                        else
                            resolve(null)
                    })
                }              
            }
        })
    })
}


//////////////////// LOGIN

exports.getUser = function (name) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM user WHERE username = ?"
      db.all(sql, [name], (err, rows) => {
        if (err) 
          reject(err);
        else if (rows.length === 0) 
          resolve(undefined);
        else {
          const user = createUser(rows[0]);
          resolve(user);
        }
        
      });
    });
  };

//Login admin 
exports.getAdmin = function (name) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM admin WHERE username = ?"

    db.all(sql, [name], (err, rows) => {
      if (err) { 
        console.log("first"+ err);
        reject(err);
      }
      else if (rows.length === 0) {
        console.log("second"+ err);
        resolve(undefined);

      }
      else {
        const user = createUser(rows[0]);
        resolve(user);
      }
      
    });
  });
};




//GET list of user
exports.listUsers = function () {
return new Promise((resolve, reject) => {
  const sql = 'select * from user';
  db.all(sql, (err, rows) => {
    if (err) {
      reject(err);
    }
    const list = rows.map((row) => ({id: row.id, username: row.username, email: row.email}));
    resolve(list);
  });
});
};



exports.checkPassword = function (user, password) {
return bcrypt.compareSync(password, user.hash);
}



//Follow User
exports.followUser = function(currentId, follId) {
return new Promise((resolve, reject) => {

  const sql1 = "SELECT * FROM followers WHERE FollowerId = ? AND FollowingID=?";
  db.all(sql1, [currentId, follId], (err, rows) => {
    if(rows.length>0){
      err="You already follow this user";
      reject(err);
  }
  else if(rows.length === 0){
    err="User does not exist";
    reject(err);
}
    else { 
    const sql = 'Insert into followers(FollowerId, FollowingID) values(?,?)';
    db.run(sql, [currentId, follId], (err) => {
        if(err){
          err="Request Failed";
            reject(err);
        }
        else
            resolve(null);
        })
      }
    })
  });
}


//UnFollow User
exports.unFollowUser = function(currentId, follId) {
  return new Promise((resolve, reject) => {

    const sql1 = "SELECT * FROM followers WHERE FollowerId = ? AND FollowingID=?";
    db.all(sql1, [currentId, follId], (err, rows) => {

    if(rows.length === 0){
      err="User does not exist";
      reject(err);
  }
      else { 
      const sql = 'Delete from followers where followerID=? AND followingID=?';
      db.run(sql, [currentId, follId], (err) => {

          if(err){
              reject(err);
          }
          else
              resolve(null);
      })
    }
  })
  });
}


//GET list of followed user
exports.followedListUsers = function (id) {
  return new Promise((resolve, reject) => {
    const sql = 'select * from user where id in (SELECT  FollowingID from followers  where FollowerID=?)';
    db.all(sql, [id], (err, rows) => {
      if (err) {
        reject(err);
      }
      const list = rows.map((row) => ({id: row.id, username: row.username, email: row.email}));
      resolve(list);
    });
  });
  };


// Add Post
  exports.postMessage = function(id, message, date) {
    return new Promise((resolve, reject) => {
        const sql = 'Insert into posts(message, date, userID) values(?,?,?)';
        db.run(sql, [message, date, id], (err) => {
            if(err){
                reject(err);
            }
            else
                resolve(null);
        })
    });
  }

//GET list of posts
exports.getPosts = function (id) {
  return new Promise((resolve, reject) => {
    const sql = 'select id, date, UserId,  substr(message, 1, 100)  as message from posts where UserId in (SELECT  FollowingID from followers  where FollowerID=? )  or UserId=?  ORDER BY date desc';
    db.all(sql, [id, id], (err, rows) => {
      if (err) {
        reject(err);
      }
      const list = rows.map((row) => ({id: row.id, message: row.message, date: row.date, UserId: row.UserId}));
      resolve(list);
    });
  });
  };



//Get Post detail
exports.getPostDetails = function (PostId) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * from comments  LEFT join user  on  user.id=comments.commenterId where postId=?';
    db.all(sql, [PostId], (err, rows) => {
      if(rows.length === 0){
        err="Post does not exist";
        reject(err);
    }
      if (err) {
        reject(err);
      }
      const list = rows.map((row) => ({Id: row.Id, commentorId: row.commenterId, postId: row.postId, Text: row.Text, Date: row.Date, username: row.username}));
      resolve(list);
    });
  });
  };



// Add a comment 
exports.addComment = function(id, postId, comment, date) {
  return new Promise((resolve, reject) => {

    const sql1 = "SELECT * FROM posts WHERE id = ?";
    db.all(sql1, [postId], (err, rows) => {

    if(rows.length === 0){
      err="Post does not exist";
      reject(err);
  }
      else { 
      const sql = 'Insert into comments(commenterId, postId, Text, Date) values(?,?,?,?)';
      db.run(sql, [id, postId, comment, date], (err) => {
          if(err){
            console.log("error mes ", err);
              reject(err);
          }
          else
              resolve(null);
        })
     }
    })
  })
}


//Delete comment
exports.deleteComment = function(id, postId, commentId) {
  return new Promise((resolve, reject) => {

    const sql0 = "SELECT * FROM comments WHERE id = ?";
    db.all(sql0, [commentId], (err, rows) => {

    if(rows.length === 0){
      err="Comment does not exist";
      reject(err);
  }

    const sql1 = "SELECT * FROM posts WHERE id = ?";
    db.all(sql1, [postId], (err, rows) => {

    if(rows.length === 0){
      err="Post does not exist";
      reject(err);
  }
      else { 
      const sql = 'Delete from comments where commenterId=? AND id=? AND postId=?';
      db.run(sql, [id, commentId, postId], (err) => {
          if(err){
              reject(err);
          }
          else
              resolve(null);
        })
       }
      });
    }); 
  });
}