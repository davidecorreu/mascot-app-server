const mongoose = require('mongoose')

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
},
  location: {
    type: String,
    required: true
},
  email: {
    type: String,
    required: true
},
  pets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet'
  }],
  web: {
    type: String,
    required: false
  },
  logo: {
    data: Buffer,
    contentType: String,
    required: false
  },
  queries: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
    accepted: { type: Boolean, default: false }
  }]
})

module.exports = mongoose.model('Organization', OrganizationSchema);
