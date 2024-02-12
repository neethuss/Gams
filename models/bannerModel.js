const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({

  bannerImage:[{ 
    type:String,
    required:true
  }],

  bannerTitle:{
    type:String
  },

  bannerSubTitle:{
    type:String
  },

  bannerUrl:{
    type:String,
  }

})

module.exports = mongoose.model('banner',bannerSchema)