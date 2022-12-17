const mongoose = require("mongoose");
const isEmail = require("validator/lib/isEmail");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
var calcBmi = require("bmi-calc");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "veuillez entrer votre nom"],
    trim: true,
    maxlength: [50, "le nom ne peut pas dépasser 50 caractères"],
  },
  lastName: {
    type: String,
    required: [true, "veuillez entrer votre Prénom"],
    trim: true,
    maxlength: [50, "le prénom ne peut pas dépasser 50 caractères"],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: [true, "l'email doit être unique"],
    required: "l'adresse email est obligatoire",
    validate: [isEmail, "veuillez saisir une adresse e-mail valide"],
  },
  role: {
    type: String,
    enum: ["joueur", "coach"],
    default: "coach",
  },
  password: {
    type: String,
    required: [true, "veuillez entrer le mot de passe"],
    minlength: [6, "le mot de passe doit comporter au moins 6 caractères"],
    select: false,
  },
  dateOfBirth: {
    type: Date,
    required: false,
  },
  city: {
    type: String,
    required: false,
  },
  weight: {
    type: Number,
  },
  height: {
    type: Number,
  },
  subscription: {
    type: String,
    enum: ["Free", "Premium", "Basic"],
    default: "Free",
  },
  sexe: {
    type: String,
    enum: ["Homme", "Femme"],
    required: [true, "veuillez sélectionner votre sexe"],
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  resetEmailToken: String,
  resetEmailExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  discipline: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Discipline",
  },
  myPlayers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  mycoaches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  inviteNumber: {
    type: Number,
    default: 0,
  },
  IMC: {
    type: Object,
    default: function () {
      if (this.weight && this.height)
        return calcBmi(this.weight, this.height, false);
    },
  },
  active: {
    type: Boolean,
    required: false,
  },
  sessionPrice: {
    type: Number,
    required: false,
  },
  fcm_key: {
    type: Array,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.getSignedJwtToken = function () {
  const payload = {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    role: this.role,
    discipline: this.discipline,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};
userSchema.methods.matchEmail = async function (enteredEmail) {
  return this.email === enteredEmail;
};

// generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.getResetEmailToken = function () {
  const resetToken = crypto.randomBytes(21).toString("hex");
  this.resetEmailToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetEmailExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
