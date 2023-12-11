var express = require('express');
var router = express.Router();
var userModel=require("./users");
var postModel= require("./post")
const passport = require('passport');
const localStrategy= require("passport-local");
const upload= require("./multer")
const profilepic =require("./multerfordp");

passport.use(new localStrategy(userModel.authenticate()));
// passport.authenticate(new localStrategy(userModel.authenticate()));


/* GET home page. */
router.get('/',ensureAuthenticated, function(req, res, next) {
 var error=req.flash('error')
//  console.log(error)
  res.render('index', {error});
});
router.get('/register',ensureAuthenticated,  function(req, res, next) {
  res.render('register', );
});

router.post('/login',
  passport.authenticate('local', {
     successRedirect: '/home', 
     failureRedirect: '/' ,
     failureFlash:true
    })
);
router.get('/logout', (req, res) => {
  req.logout(function(err){
    if(err) {
      return next(err);
    }
    res.redirect('/');
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

function ensureAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    // If the user is authenticated, proceed to the next middleware or route handler
    return next();
  } else {
    // If the user is not authenticated, redirect to the login page
    res.redirect('/home');
  }
}




router.get('/editprofile', isLoggedIn, async function(req, res, next) {
  const user= await userModel.findOne({username:req.session.passport.user})
  res.render('editprofile', {user});
});
router.post('/editprofile', isLoggedIn, async (req, res) => {
  const { fullname, username } = req.body;

  try {
    // Find the user by ID (you need to ensure you have user authentication and obtain the user ID)
    const userId = req.user.id; // Assuming you have stored user information in req.user after authentication
    const user = await userModel.findById(userId);

    // Update user information
    user.fullname = fullname;
    user.username = username;
    
    // Save the updated user
    await user.save();
    // Redirect back to the login page with a success message
    req.login(user, (err) => {
      if (err) {
        console.error(err);
        return res.render('error');
      }
      return res.redirect('/profile'); // Redirect to the user's profile page after updating
    });
  } catch (error) {
    console.error(error);
    res.render('error');
  }
});
// Define the route
router.get('/viewpost/:postId', isLoggedIn, async (req, res) => {

  try {
    const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
    // console.log(user);
    const postId = req.params.postId;
    const post = await postModel.findById(postId);
    console.log(post)
    const postuser = await userModel.findById(post.user._id);
    // console.log(postuser);
    if (!post) {
      return res.status(404).render('not-found'); // Handle not found scenario
    }
      // Check if the logged-in user is already following the target user
      const loggedUserId = req.user.id;
      const loggedUser = await userModel.findById(loggedUserId);
      const userFollowsLoggedUser = loggedUser.following.includes(postId);
      console.log(userFollowsLoggedUser);
    res.render('viewpost',{post,user,postuser,userFollowsLoggedUser});
  } catch (error) {
    console.error(error);
    res.render('error');
  }
});

router.get('/profile/viewpost/:postId', isLoggedIn, async (req, res) => {

  try {
    const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
    // console.log(user);
    const postId = req.params.postId;
    const post = await postModel.findById(postId);
    // console.log(user)
    const postuser = await userModel.findById(post.user._id);
    // console.log(postuser);
    if (!post) {
      return res.status(404).render('not-found'); // Handle not found scenario
    }
      // Check if the logged-in user is already following the target user
      const loggedUserId = req.user.id;
      const loggedUser = await userModel.findById(loggedUserId);
      const userFollowsLoggedUser = loggedUser.following.includes(postId);
      console.log(userFollowsLoggedUser);
    res.render('profileViewPost',{post,user,postuser,userFollowsLoggedUser});
  } catch (error) {
    console.error(error);
    res.render('error');
  }
});

router.get('/profile/:postUserId', isLoggedIn, async function(req, res, next) {
  
  

  try {

    const user = await userModel.findById(req.user.id); 
    const postUserId= req.params.postUserId;
    const postUser = await userModel.findById(postUserId);
    const postUserAllPost = await postModel.find({ user: postUserId});

    const userId = req.params.postUserId;
    const userparams = await userModel.findById(userId);
    console.log(userparams)
    console.log(postUser)

    if (!user) {
      return res.status(404).render('not-found'); // Handle not found scenario
    }

    // Check if the logged-in user is already following the target user
    const loggedUserId = req.user.id;
    const loggedUser = await userModel.findById(loggedUserId);
    const userFollowsLoggedUser = loggedUser.following.includes(userId);

    res.render('postUserprofile', { userparams, userFollowsLoggedUser,user,postUser,postUserAllPost });
  } catch (error) {
    console.error(error);
    res.render('error');
  }
});


// Endpoint to toggle follow status
router.post('/api/togglefollow/:userId', isLoggedIn, async (req, res) => {
  try {
    const userIdToToggle = req.params.userId;
    const loggedUserId = req.user.id;

    // Find the logged-in user
    const loggedUser = await userModel.findById(loggedUserId);

    // Check if the user is already following
    const isFollowing = loggedUser.following.includes(userIdToToggle);

    // Toggle follow status
    if (isFollowing) {
      // Unfollow
      loggedUser.following.pull(userIdToToggle);

      // Remove logged user from the follower's followers list
      const userToUnfollow = await userModel.findById(userIdToToggle);
      userToUnfollow.followers.pull(loggedUserId);
      await userToUnfollow.save();
    } else {
      // Follow
      loggedUser.following.push(userIdToToggle);

      // Add logged user to the followed user's followers list
      const userToFollow = await userModel.findById(userIdToToggle);
      userToFollow.followers.push(loggedUserId);
      await userToFollow.save();
    }

    await loggedUser.save();

    res.json({ success: true, isFollowing: !isFollowing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});
// Endpoint to follow a user

//Endpoints start likes 

// Endpoint to toggle like status for a post
router.post('/api/togglelike/:postId', isLoggedIn, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    // Find the post
    const post = await postModel.findById(postId);

    // Check if the user has already liked the post
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike the post
      post.likes = post.likes.filter(likedUserId => likedUserId.toString() !== userId);
    } else {
      // Like the post
      post.likes.push(userId);
    }

    // Save the updated post
    await post.save();

    // Send response with updated like status and count
    res.json({
      success: true,
      isLiked: !isLiked,
      likeCount: post.likes.length,
    });
  } catch (error) {
    console.error('Error:', error);
    res.json({ success: false, error: 'Failed to toggle like status' });
  }
});

//delete post logic
router.post('/api/deletepost/:postId',isLoggedIn, async (req, res) => {
  const postId = req.params.postId;

  try {
    const post = await postModel.findById(postId);
    // console.log(post.user.toString())

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if the logged-in user is the owner of the post
    const loggedInUserId = req.user._id;
    // console.log(loggedInUserId.toString())

    if (post.user.toString() !== loggedInUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await postModel.findByIdAndDelete(postId);

    res.json({ success: true, message: 'Post deleted successfully', redirect: '/profile' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
});







router.get('/home', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
    const loggedInUserId = req.user?.id || null;
    const posts = await postModel.find({ user: { $ne: loggedInUserId } }).populate('user');

    res.render('home', { user, posts });
  } catch (error) {
    console.error(error);
    res.render('error');
  }
});
router.get('/profile',isLoggedIn,async function(req, res, next) {
  const user= await userModel.findOne({username:req.session.passport.user}).populate("posts")
  // console.log(user);
  res.render('profile',{user});
});

router.post('/upload',isLoggedIn, upload.single('file'), async function (req, res, next) {
if(!req.file){
  return res.status(404).send("no file were given")
}
const user= await userModel.findOne({username:req.session.passport.user});
const postData= await postModel.create({
  title:req.body.title,
  caption: req.body.caption,
  image:req.file.filename,
  user:user._id,
});

  user.posts.push(postData._id);
  await user.save()
  console.log("uploding done")
  res.redirect("/profile");
});

router.post('/uploadprofile', isLoggedIn,  profilepic.single('file'), async (req, res) => {
  console.log(req.file)
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    if (!user) {
      return res.status(404).send('User not found.');
    }
    if (!req.file) {
      // No file was uploaded
      return res.status(400).send('No file uploaded.');
    }
    // Update the user's picture field with the filename
    user.dp = req.file.filename;
    // Save the updated user model
    await user.save();
    // Redirect to the profile page on success
    res.redirect('/profile');
  } catch (error) {
    console.error(error);

  }
});

router.post("/register", (req, res, next) => {
  const { username, fullname, email } = req.body;
  const newUser = new userModel({ username, fullname, email });

  // Assuming you're using passport-local-mongoose for user registration
  userModel.register(newUser, req.body.password).then(function(){
    passport.authenticate("local")(req, res, function () {
      res.redirect("/home");
    });
  }).catch((err) => {
    // Handle registration errors
    console.error(err);
    res.redirect("/register"); // Redirect to registration page on error
  });
});




module.exports = router;
