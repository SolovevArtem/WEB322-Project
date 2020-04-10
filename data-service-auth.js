var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

let userSchema = new Schema({
    "userName": {
        "type": String,
        "unique": true
    },
    "password": String,
    "email": String,
    "loginHistory": [{
        "dateTime": Date,
        "userAgent": String
    }]
})

var User;

module.exports.initialize = function() {
    return new Promise(function (resolve, reject){
        let db = mongoose.createConnection("mongodb+srv://Solart:webproject2020@web322-project-motor.mongodb.net/web322_week8?retryWrites=true&w=majority");
        db.on('error',(err)=>{
            reject(err);
        });
        db.once('open',()=>{
            User = db.model("users", userSchema);
            resolve();
        });
    });
};


module.exports.registerUser = function(userData) {
    return new Promise(function (resolve, reject) {
        if (userData.password === userData.password2) {
            let newUser = new User(userData);
            bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(userData.password, salt, function (err, hash) {
                    if (err) {
                        reject("There was an error encrypting the password");
                    }
                    else {
                        newUser.password = hash;
                        newUser.save()
                        .then(() => {
                            resolve();
                        })
                        .catch((err) => {
                            if (err.code == 11000) {
                                reject("User Name already taken");
                            }
                            else {
                                reject("There was an error creating the user:" + err);
                            }
                        });
                    }
                });
            });
        }
        else {
            reject("Passwords do not match");
        }
    });
}      

            


module.exports.checkUser = function(userData) {
    return new Promise((resolve, reject) => {
        User.find({userName: userData.userName})
            .exec()
            .then((users) => {
                if(!users){
                    reject('Unable to find user: '+userData.userName);
                }else{
                    bcrypt.compare(userData.password, users[0].password).then((res)=>{
                        if(res===true){
                            users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                            User.update(
                                { userName: users[0].userName },
                                { $set: {loginHistory: users[0].loginHistory }},
                                { multi: false }
                            ).exec()
                            .then((() => {
                                resolve(users[0]);
                            }))
                            .catch((err) => {
                                reject("There was an error verifying the user: " + err);
                            });
                        } else{
                            reject('Incorrect Password for user: '+userData.userName);
                        }
                    })
                }
            })
            .catch(() => {
                reject('Unable to find user: '+userData.userName);
            })
    });
}