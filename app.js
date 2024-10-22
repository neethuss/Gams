const express = require('express')
const path = require('path')
const flash = require('connect-flash')
const session = require('express-session')
const mongoose = require('mongoose')


require('dotenv').config()

const app = express()


app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))



app.use(express.static(path.join(__dirname, "public")));

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.use(express.json())
app.use(express.urlencoded({extended:false}))

app.use(session({
  secret: process.env.SESSION_SECRET,  
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.header("Cache-Control", "private, no-store, must-revalidate");
  next();
});

app.use(flash())

app.use('/',require('./routes/userRoutes'))
app.use('/admin',require('./routes/adminRoutes'))

const port = process.env.PORT || 4000;

const Banner = require('./models/bannerModel.js');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running in http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.log("Error connecting to mongodb", error.message);
  }); 