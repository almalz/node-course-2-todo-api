const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true ,
        unique: true,
        validate:{
            validator:  validator.isEmail,
            message: `{VALUE} is not a valid email`
        }
    },

    password: {
        type: String,
        required: true,
        minlength: 6
    },

    tokens: [{
        access: {
            type: String,
            require: true
        },
        token: {
            type: String,
            require: true
        }
    }]
});


UserSchema.methods.toJSON = function () {
    var user = this;
    var userObject = user.toObject();

    return _.pick(userObject, ['_id', 'email'])
};


UserSchema.methods.generateAuthToken = function () {
    var user = this;

    var access = 'auth';
    var token = jwt.sign({_id: user._id.toHexString(), access}, 'some secret').toString();

    user.tokens = user.tokens.concat([{access, token}]);

    return user.save().then(() => {
        return token;
    });
};

UserSchema.statics.findByToken = function (token) {
    var User = this;
    var decoded;

    try {
        decoded = jwt.verify(token, 'some secret')
    } catch (e) {
        return Promise.reject();
    }

    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });

};

UserSchema.pre('save', function (next) {
    var user = this;

    if(user.isModified('password')){

        var password = user.password;

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, (err,hash) => {
                console.log('hash: ',hash);
                user.password = hash
                next();
            });
        });

    } else {
        next();
    }
});

var User = mongoose.model('User', UserSchema);

module.exports = {User};
