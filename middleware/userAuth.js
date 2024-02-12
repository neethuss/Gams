const express = require('express')
const userCollection = require('../models/userModel')


const isBlocked = async (req, res, next) => {
  try {
    const user = req.session.user;
   
    const userEmail = user ? user.email : req.body.email;
    
    const check = await userCollection.findOne({ email: userEmail });

    if (req.session.user && check && !check.isBlocked) {
      console.log('user is blocked');
      req.session.destroy((err) => {
        if (err) {
          res.send(err);
        } else {
          res.status(500).render('userviews/login', { successMsg: [], errorMsg: ["User is Blocked"] });
        }
      });
    } else {
      next();
    }
  } catch (err) {
    console.log("Err in block", err);
    res.status(502).send('errrrrrrrrrrrrrrrrr');
  }
};

module.exports = {
  isBlocked
}