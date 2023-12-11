const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect('mongodb://localhost/pintrest-clone', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db=mongoose.connection;

// Event handling for successful MongoDB connection
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Event handling for MongoDB connection error
db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

const userSchema = new mongoose.Schema({
  username: String,
  fullname:String,
  email: String,
  password: String,
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dp:String,
  posts:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Post' 
  }]
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

module.exports = User;