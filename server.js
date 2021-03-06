/**
 * Created by epogrebezky on 10/23/15.
 */
var express=require('express');
var nodemailer = require("nodemailer");
var path = require('path');

var app=express();
/*
 Here we are configuring our SMTP Server details.
 STMP is mail server which is responsible for sending and recieving email.
 */
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "text2code@gmail.com",
        pass: "text2code2015"
    }
});
/*------------------SMTP Over-----------------------------*/

/*------------------Routing Started ------------------------*/
app.use(express.static(path.join(__dirname, 'static')));

app.get('/',function(req,res){
    res.sendfile(path.join(__dirname, 'index.html'));
});

app.get('/send',function(req,res){
    var mailOptions={
        to : req.query.to,
        subject : req.query.subject,
        text : req.query.text
    }
    console.log(mailOptions);
    smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
            res.end("error");
        }else{
            console.log("Message sent: " + response.message);
            res.end("sent");
        }
    });
});

/*--------------------Routing Over----------------------------*/

app.listen(3000,function(){
    console.log("Express Started on Port 3000");
});