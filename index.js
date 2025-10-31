import express from 'express';
import bcrypt from "bcrypt";
import cors from "cors";
import cookieParser from 'cookie-parser';
import bodyParser from "body-parser";
import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import { User,Task } from './config.js';
const app = express();

app.use(bodyParser.json());

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));


app.use(cookieParser());

const PORT = process.env.PORT || 5000;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Access denied. No token provided." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

app.get('/',(req,res)=>{
    res.send("API is running...");
});

app.get('/tasks',verifyToken,async  (req,res)=>{
    try{
        const userId = req.user.id;
        const data = await Task.find({userId:userId});
        res.status(200).json(data);
    }
    catch(err){
        res.status(500).json({error:"Failed to fetch tasks"});
    }
});

app.get('/userdeets',verifyToken,async  (req,res)=>{
    try{
        const user = await User.findById(req.user.id);
        res.status(200).json({_id:user._id, name: user.name, email: user.email});
    }
    catch(err){
        res.status(500).json({error:"Failed to fetch user details"});
    }       
});

app.post('/signup', async (req,res)=>{
    
    try{
        const {name,email,password} = req.body;
        if(!name || !email || !password){
            return res.status(422).json({error:"Please fill all the fields"});
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }
        const salt = await bcrypt.genSalt(10); // generate salt
        const hashedpassword = await bcrypt.hash(password, salt);
        const newUser = new User({name,email,hashedpassword});
        await newUser.save();
        res.status(201).json({message:"User registered successfully"});
    }
    catch(err){
        res.status(500).json({error:"Failed to register"}); 
    }
});

app.post('/login', async (req,res)=>{
    try{
        const {email,password} = req.body;
        if(!email || !password){
            return res.status(422).json({error:"Please fill all the fields"});
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        const isMatch = await bcrypt.compare(password, user.hashedpassword);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        const token = jwt.sign({ id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({ message: "Login successful", token });
    }
    catch(err){
        res.status(500).json({error:"Login failed"});
    }
})

app.post('/addtask',verifyToken, async (req,res)=>{
    try{
        const userId = req.user.id;
        const {title,description,date} = req.body; 
        if(!title || !description || !date){
            return res.status(422).json({error:"Please fill all the fields"});
        }
        const newTask =new Task({userId,title,description,date});
        await newTask.save();
        res.status(201).json({message:"Task added successfully"});
    }
    catch(err){
        res.status(500).json({error:"Failed to add task"});
    }
});

app.get('/edit/:id',verifyToken, async (req,res)=>{
    try{
        const {id} = req.params;    
        const task = await Task.findById(id); 
        res.status(200).json(task);
    }
    catch(err){
        res.status(500).json({error:"Failed to fetch task"});
    }
});       

app.post('/edittask/:id',verifyToken, async (req,res)=>{
    try{
        const {id} = req.params;
        const {title,description,date} = req.body;
        await Task.findByIdAndUpdate(id,{title,description,date});
        res.status(200).json({message:"Task updated successfully"});
    }
    catch(err){
        res.status(500).json({error:"Failed to update task"});
    }
});

app.delete('/del/:id',verifyToken, async (req,res)=>{
    try{
        const {id} = req.params;  
        await Task.findByIdAndDelete(id);
        res.status(200).json({message:"Task deleted successfully"});
    }
    catch(err){
        res.status(500).json({error:"Failed to delete task"});
    }
});

app.get('/update/:id',verifyToken, async (req,res)=>{
    try{
        const user = await User.findById(req.params.id);
        res.status(200).json({name: user.name, email: user.email,password: user.hashedpassword});
    }  
    catch(err){
        res.status(500).json({error:"Failed to fetch user details"});
    }  
});

app.put('/update/:id',verifyToken, async (req,res)=>{
    try{
        const {name,email,password} = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedpassword = await bcrypt.hash(password, salt);
        await User.findByIdAndUpdate(req.params.id,{name,email,hashedpassword});
        res.status(200).json({message:"User updated successfully"});
    }
    catch(err){
        res.status(500).json({error:"Failed to update user details"});
    }  
});



app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT} `);
});