class User {
    constructor(id, username, email, hash) {
      if (id) 
      this.id = id;
      this.username = username;
      this.email = email;
      this.hash = hash;
    }
  }
  
  module.exports = User;

  