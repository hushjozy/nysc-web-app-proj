const mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
// create an schema
const CorpSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: String,
  email: { type: String, required: true }
});

CorpSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Corp", CorpSchema);
