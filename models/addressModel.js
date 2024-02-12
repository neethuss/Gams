const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({

  userId:{
    type:mongoose.Schema.ObjectId,
    ref:'user',
    required:true
  },
  name:{
    type:String,
    required:true
  },
  address:{
    type:String,
    required:true
  },

  pincode:{
    type:String,
    required:true
  },
  district:{
    type:String,
    required:true
  },
  state:{
    type:String,
    required:true
  },
  country:{
    type:String,
    required:true
  },
  phone:{
    type:String,
    required:true
  }
})

module.exports = mongoose.model('address',addressSchema)