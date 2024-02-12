const userCollection = require('../../models/userModel')
const walletCollection = require('../../models/walletModel')
const bcrypt = require('bcrypt')


//get method for rendering signup otp page
const getSignupOtp = async(req,res)=>{
  try {
    const errorMsg = req.flash('error')
     res.render('userViews/otp', { expireTime: req.session.expireTime ,errorMsg});
  } catch (error) {
     console.log(error)
     res.status(500).send("Error while rendering otp page")
  }
 }
 

 //post method for signup otp
const postSignupOtp = async(req,res)=>{
  try {
    const { digit1, digit2, digit3, digit4, digit5, digit6 } = req.body;
    const enteredOtp = digit1 + digit2 + digit3 + digit4 + digit5 + digit6;

    const storedOtp = req.session.otp;
    const expireTime = req.session.expireTime
    
    if (enteredOtp === storedOtp && new Date() <=new Date(expireTime)) {

      req.flash("error", null);
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hashSync(
        req.session.userDetails.password,
        saltRounds
      );

      const newUser = new userCollection({
        username: req.session.userDetails.username,
        email: req.session.userDetails.email,
        phone: req.session.userDetails.phone,
        password: hashedPassword,
        referalCode:req.session.userDetails.referal
      });

      await newUser.save();
      console.log("User added successfully");

      let newUserAmount = 100
      let referedUserAmount = 250

      if(req.session.userDetails.referedCode){
        const newUser = await userCollection.findOne({email:req.session.userDetails.email})
        const newUserId = newUser._id
        await walletCollection.findOneAndUpdate(
          { userId:newUserId },
          { $inc: { walletAmount: newUserAmount } },
          { new: true, upsert: true }
        );

        await walletCollection.findOneAndUpdate(
          {  userId:newUserId },
          {
            $push: {
              walletHistory: {
                process: "amount credited for using referal code",
                amount: newUserAmount,
                date: Date.now(),
              },
            },
          },
          { new: true }
        );

        const referedUser = await userCollection.findOne({referalCode:req.session.userDetails.referedCode})
      const referedUserId = referedUser._id
      const referedUserEmail = referedUser.email
        await walletCollection.findOneAndUpdate(
          { userId:referedUserId },
          { $inc: { walletAmount: referedUserAmount } },
          { new: true, upsert: true }
        );

        await walletCollection.findOneAndUpdate(
          { userId:referedUserId },
          {
            $push: {
              walletHistory: {
                process: "ampunt credited when a user signup with your referal",
                amount: referedUserAmount,
                date: Date.now(),
              },
            },
          },
          { new: true }
        );

        await userCollection.findOneAndUpdate({email:req.session.userDetails.email},{referedBy:referedUserEmail})


      }
      req.flash("success", "OTP verification completed"); // Set flash message
      res.redirect("/login");
    } else if(enteredOtp != storedOtp && new Date() <=new Date(expireTime)) {
      req.flash('error','wrong otp')
      res.redirect("/signupOtp");
    }
  } catch (error) {
    console.log(error)
    res.status(500).send("Error while post signup otp")
  }
}


//get method for get forgot password otp page
const getForgotPasswordOtp = async(req,res)=>{
  try {
    const errorMsg = req.flash("error")
    res.render('userViews/forgotPasswordOtp',{expireTime:req.session.expireTime,errorMsg})
  } catch (error) {
    console.log
  }
}


//post method for forgot password otp
const postForgotPasswordOtp = async(req,res)=>{
  try {
    const { digit1, digit2, digit3, digit4, digit5, digit6 } = req.body;
    const enteredOtp = digit1 + digit2 + digit3 + digit4 + digit5 + digit6;

    const storedOtp = req.session.otp;
    const expireTime = req.session.expireTime
    
    if(storedOtp != enteredOtp){
      req.flash("error","Wrong otp, Try again")
      res.redirect('userViews/forgotPasswordOtp')
    }else if(enteredOtp === storedOtp && new Date() <=new Date(expireTime)){
      res.redirect('/newPassword')
    }
    
  } catch (error) {
    console.log(error)
    res.status(500).send("Error while post forgot password otp")
  }
}




module.exports = {
  getSignupOtp,
  postSignupOtp,
  getForgotPasswordOtp,
  postForgotPasswordOtp,
 
}