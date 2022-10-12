const mongoose =require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please provide a first name"],
      trim: true,
      minLength: [3, "Name must be at least 3 characters."],
      maxLength: [100, "Name is too large"],
    },
    lastName: {
      type: String,
      required: [true, "Please provide a first name"],
      trim: true,
      minLength: [3, "Name must be at least 3 characters."],
      maxLength: [100, "Name is too large"],
    },
    email: {
      type: String,
      validate: [validator.isEmail, "Provide a valid Email"],
      trim: true,
      lowercase: true,
      unique: true,
      required: [true, "Email address is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      validate: {
        validator: (value) =>
          validator.isStrongPassword(value, {
            minLength: 6,
            minLowercase: 3,
            minNumbers: 1,
            minUppercase: 1,
            minSymbols: 1,
          }),
        message: "Password {VALUE} is not strong enough.",
      },
    },
    confirmPassword: {
      type: String,
      required: [true, "Please confirm your password"],
      validate: {
        validator: function (value) {
          return value === this.password;
        },
        message: "Passwords don't match!",
      },
    },

    stripe_account_id: "",
    stripe_seller: {},
    stripeSession: {},
  },
  { timestamps: true }
);

/**
 * While saving user, we need to make sure the password is hashed, not plain password
 * hashing should be done only in 2 situations
 * 1. if it is the first time a user is being saved/created
 * 2. user have updated/modified the existing password
 * for handling such requirements, we can use 'pre' middleware in our schema
 * this middleware/function will run each time user is saved/created
 * and/or password is modified/updated
 */

userSchema.pre("save", function (next) {
  this.confirmPassword = undefined;
  let user = this;
  // hash password only if user is changing the password or registering for the first time
  // make sure to use this otherwise each time user.save() is executed, password
  // will get auto updated and you can't login with original password
  if (user.isModified("password")) {
    return bcrypt.hash(user.password, 12, function (err, hash) {
      if (err) {
        console.log("BCRYPT HASH ERR ", err);
        return next(err);
      }
      user.password = hash;
      user.confirmPassword = undefined;
      return next();
    });
  } else {
    return next();
  }
});

userSchema.methods.comparePassword = function (password, next) {
  bcrypt.compare(password, this.password, function (err, match) {
    if (err) {
      console.log("COMPARE PASSWORD ERR", err);
      return next(err, false);
    }
    // if no err, we get null
    console.log("MATCH PASSWORD", match);
    return next(null, match); // true
  });
};

module.exports= mongoose.model("User", userSchema);
