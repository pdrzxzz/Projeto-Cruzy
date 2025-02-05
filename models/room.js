const mongoose = require('mongoose');

//room schema, (how a room should look like)
const roomSchema = new mongoose.Schema({
    theme: {
      type: String,
      required: true
    },
    owner: {
      type: String,
    },
    language: {
      type: String,
    },
    themeArray: {
      type: Array,
    }
  });
  
  module.exports = mongoose.model('Room', roomSchema);