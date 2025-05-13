const userCollection = require("../../models/userModel");
const bannerCollection = require("../../models/bannerModel");
const cartCollection = require("../../models/cartModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

//get method for rendering home page
const getHome = async (req, res) => {
  try {
    const successMsg = req.flash("success");
    let user = null;
    let cartQuantity = 0;
    if (req.session.user) {
      user = req.session.user;
      const cart = await cartCollection.findOne({
        userId: req.session.user._id,
      });
      cartQuantity = cart ? cart.products.length : 0;
    }
    const banners = await bannerCollection.find();
    res.render("userViews/home", { user, successMsg, banners, cartQuantity });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering home");
  }
};

//get method for rendering login page
const getLogin = async (req, res) => {
  try {
    const successMsg = req.flash("success");
    const errorMsg = req.flash("error");

    if (req.session.user) {
      return res.redirect("/");
    }
    req.session.otpVerified = null;

    res.render("userViews/login", {
      successMsg,
      errorMsg,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering login page");
  }
};

//post method for login
const postLogin = async (req, res) => {
  try {
    const check = await userCollection.findOne({ email: req.body.email });

    if (!check) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }

    if (check.isBlocked) {
      req.flash("error", "User is blocked");
      return res.redirect("/login");
    }

    const isPasswordMatch = await bcrypt.compare(
      req.body.password,
      check.password
    );

    if (isPasswordMatch) {
      req.session.user = check;
      req.flash("success", "User logged in successfully");
      return res.redirect("/");
    } else {
      req.flash("error", "Incorrect password");
      return res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
    req.flash("error", "An error occurred during login");
    return res.redirect("/login");
  }
};

//get method for rendering signup page
const getSignup = async (req, res) => {
  try {
    const errorMsg = req.flash("error");
    res.render("userViews/signup", { errorMsg });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering signup page");
  }
};

// post method for signup
const postSignup = async (req, res) => {
  try {
    const username = req.body.username;
    const email = req.body.email;
    const phone = req.body.phone;
    const password = req.body.password;
    const referedCode = req.body.referal ?? "";

    const check = await userCollection.find({ email: email });
    if (check.length > 0) {
      req.flash("error", "User already exists");
      res.redirect("signup");
    } else {
      const referal = generateReaferal();
      console.log("Your referal is:", referal);
      const otp = generateotp();
      console.log(otp);

      const emailText = `Hello ${username}, this is from GAMS. Your OTP is : ${otp}`;

      const mailOptions = {
        from: "neethusa162000@gmail.com",
        to: email,
        subject: "OTP Verification",
        text: emailText,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error while sending OTP");
          req.flash("error", "Error while sending OTP, try again");
          res.render("userViews/signup");
        } else {
          console.log("OTP send:", info.response);
          req.session.userDetails = {
            username,
            email,
            phone,
            password,
            referal,
            referedCode,
          };
          console.log(otp);

          req.session.otp = otp;

          req.session.expireTime = new Date(expireTime);

          res.redirect("/signupOtp");
        }
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while post signup");
  }
};

//generating otp
let expireTime;
const generateotp = () => {
  const now = new Date();
  expireTime = new Date(now.getTime() + 1.5 * 60000);

  return Math.floor(100000 + Math.random() * 900000).toString();
};

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "neethusa162000@gmail.com",
    pass: "ohtg gpdm yjin rxum",
  },
});

//generating referal code
function generateReaferal() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const codeLength = 6;
  let randomCode = "";

  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomCode += characters.charAt(randomIndex);
  }

  return randomCode;
}

//get method for resending otp
const getResendOtp = async (req, res) => {
  try {
    const expireTime = new Date(Date.now() + 1 * 60000); 
    req.session.expireTime = expireTime;
    
    if (!req.session.email) {
      req.flash("error", "Email not found, please go back to forgot password");
      return res.redirect("/forgotPassword");
    }
    
    const check = await userCollection.findOne({
      email: req.session.email,
    });
    
    if (!check) {
      req.flash("error", "User not found, please go to login");
      return res.redirect("/login");
    } else {
      const otp = generateotp();
      console.log(otp);

      const emailText = `Hello ${check.username}, this is from GAMS. Your OTP is : ${otp}`;

      const mailOptions = {
        from: "neethusa162000@gmail.com",
        to: req.session.email,
        subject: "OTP Verification",
        text: emailText,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error while sending OTP", error);
          req.flash("error", "Error while sending OTP, try again");
          res.render("userViews/forgotPasswordOtp", {
            expireTime: req.session.expireTime,
            errorMsg: req.flash("error")
          });
        } else {
          console.log("OTP sent:", info.response);
          console.log(otp);

          req.session.otp = otp;
          req.session.expireTime = expireTime;

          res.redirect("/forgotPasswordOtp");
        }
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while resending forgot password OTP");
  }
};

//get method for rendeing forgor password page
const getForgotPassword = async (req, res) => {
  try {
    res.render("userViews/forgotPassword");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while rendering forgot password page");
  }
};

// Get method for resending signup OTP
const getResendSignupOtp = async (req, res) => {
  try {
    const expireTime = new Date(Date.now() + 1 * 60000); 
    req.session.expireTime = expireTime;
    
    if (!req.session.userDetails || !req.session.userDetails.email) {
      req.flash("error", "Session expired, please go back to signup");
      return res.redirect("/signup");
    }
    
    const otp = generateotp(); 
    console.log(otp);

    const emailText = `Hello ${req.session.userDetails.username}, this is from GAMS. Your OTP is : ${otp}`;

    const mailOptions = {
      from: "neethusa162000@gmail.com",
      to: req.session.userDetails.email,
      subject: "OTP Verification",
      text: emailText,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error while sending OTP", error);
        req.flash("error", "Error while sending OTP, try again");
        res.render("userViews/otp", {
          expireTime: req.session.expireTime,
          errorMsg: req.flash("error")
        });
      } else {
        console.log("OTP sent:", info.response);
        console.log(otp);

        req.session.otp = otp;
        req.session.expireTime = expireTime;

        res.redirect("/signupOtp");
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while resending signup OTP");
  }
};

//post method for forgot password
const postForgotPassword = async (req, res) => {
  try {
    const email = req.body.email;
    req.session.email = email;
    const user = await userCollection.findOne({ email: email });
    if (user) {
      const otp = generateotp();
      console.log(otp);
      const emailText = `Hello ${email}, this is from GAMS. Your OTP is : ${otp}`;

      const mailOptions = {
        from: "neethusa162000@gmail.com",
        to: email,
        subject: "OTP Verification",
        text: emailText,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error while sending OTP");
          req.flash("error", "Error while sending OTP, try again");
          res.render("userViews/forgotPassword");
        } else {
          console.log("OTP send:", info.response);
          console.log(otp);

          req.session.otp = otp;
          req.session.expireTime = new Date(expireTime);

          res.redirect("/forgotPasswordOtp");
        }
      });
    } else {
      req.flash("error", "User didnt exist");
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while post forgot password");
  }
};

//get method for rendering a new password page for setting new password
const getNewPassword = async (req, res) => {
  try {
    res.render("userViews/newPassword");
  } catch (error) {
    console.log("error");
    res.status(500).send("Error while rendering new password page");
  }
};

//post method for new password
const postNewPassword = async (req, res) => {
  try {
    const newPassword = req.body.password;
    const email = req.session.email;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hashSync(newPassword, saltRounds);

    await userCollection.findOneAndUpdate(
      { email: email },
      { password: hashedPassword }
    );
    req.flash("success", "New password set.Login now");
    req.session.email = null;
    req.session.otpVerified = null;
    res.redirect("/login");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while post new password");
  }
};

// get method for session destroy while applying a referel code
const getReferalLogout = async (req, res) => {
  req.session.user = null;
  res.redirect("/signup");
};

//logout user session
const getLogout = (req, res) => {
  req.session.user = null;
  res.redirect("/login");
};

module.exports = {
  getHome,
  getLogin,
  postLogin,
  getResendOtp,
  getResendSignupOtp,
  getForgotPassword,
  postForgotPassword,
  getSignup,
  postSignup,
  getNewPassword,
  postNewPassword,
  getReferalLogout,
  getLogout,
};
