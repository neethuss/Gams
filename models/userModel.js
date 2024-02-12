const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },

  userAddress:{
    type:mongoose.Schema.ObjectId,
    ref:'address'
  },

  appliedCoupons:[{
    type:mongoose.Schema.ObjectId,
    ref:'coupon'
  }],

  referalCode:{
    type:String
  },
  
  referedBy:{
    type:String
  },

  isBlocked: {
    type: Boolean,
    default: true,
  },
});



module.exports = mongoose.model("user", userSchema);
