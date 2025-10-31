import mongoose from 'mongoose';

const connect = mongoose.connect("mongodb+srv://Ujjwal:ujjwal@basic.rkdikfz.mongodb.net/?appName=Basic")

connect.then(() =>{
    console.log("Database connected !!!");
})
.catch((err)=>{
    console.log(err)
})

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    hashedpassword:{
        type:String,
        require:true
    }       
});

const taskSchema = new mongoose.Schema({
    userId:{
        type:String,
        require:true
    },
    title:{
        type:String,
        require:true
    },
    description:{
        type:String,   
        require:true
    },
    date:{
        type:Date,
        require:true
    },

});

const User = mongoose.model("User" ,userSchema);   
const Task = mongoose.model("Task" ,taskSchema); 
export {User,Task};