const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({

  category_name:{
    type:String,
    required:true
  },

  category_description:{
    type:String,
    required:true
  },

  isBlocked:{
    type:Boolean,
    default:true
  }

})

module.exports = mongoose.model('category',categorySchema)