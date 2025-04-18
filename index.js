
import {PrismaClient} from "@prisma/client"
import express from "express"
import bcrypt from "bcrypt";
import { verifyUser } from './middlewares/register.usermiddleware.js';
import { verifyUserDetails } from './middlewares/check.userdetails.js';
import { checkPasswordStrength } from './middlewares/password.strength.js';
import cors from 'cors';
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser';
import { verifyUserInfo } from './middlewares/verifyUser.js';



export const app = express();
app.use(cookieParser())
const client = new PrismaClient();
app.use(express.json())
app.use(cors({
    
    origin:[ 
        'http://localhost:5174',
        'https://blogit-front-end-eesk.vercel.app'
    ],
    methods:['POST','GET','PUT','PATCH','DELETE'],
    credentials:true
  }));

app.post('/auth/register',[verifyUser, verifyUserDetails, checkPasswordStrength ], async (req,res)=>{
    const {firstName,lastName,emailAddress,userName,password} = req.body
    const hashedPassword = await bcrypt.hash(password,12);
   try {
    const user = await client.user.create({
        data: {
            firstName,
            lastName,
            emailAddress,
            userName,
            password:hashedPassword
        }
    })
    res.status(200).json({
        message:"User created successfully",
        status:"Success",
        data:user
    })
    
   } catch (error) {
    res.status(500).json({
        message:"Error creating user",
        status:"Failed",        
    })
   }
    
})



app.post('/auth/login',async(req,res)=>{
    
    const {identifier,password} = req.body
    console.log(identifier,password)
    try {

        const user = await client.user.findFirst({
            where:{
                OR:[
                    {
                        emailAddress:identifier
                    },
                    {
                        userName:identifier
                    }]
            }
        })
        if(!user){
            return res.status(401).json({
                message:"Invalid username",
                status:"fail",                
            })
        }
      
        const passwordMatch = await bcrypt.compare(password,user.password)
        console.log(passwordMatch)
        if(!passwordMatch){
            return res.status(401).json({
                message:"Invalid password",
                status:"fail",
            })
        }

        const payload = {
           userId: user.userId,
           firstName: user.firstName,
           lastName: user.lastName,
           emailAddress: user.emailAddress,
           userName: user.userName

        }

        const token = jwt.sign(payload,process.env.JWT_SECRET_KEY,{})
        
        res.status(200).cookie('token',token,{httpOnly:true,sameSite:"None",secure:true}).json({
            message:"Login successful",
            status:"Success",
            data:user
        })

    } catch (error) {
        
    }

})

app.get('/auth/profile', verifyUserInfo, async(req,res)=>{
    const userId= req.user.userId;
    console.log(userId)
    
    try {
        const user = await client.user.findFirst({
            where:{
                userId
            }
        })   
        res.status(200) .json({
            message: "User fetched successfully",
            data: user
        })
        
    } catch (error) {
        res.json({
            message: "An error occurred",
            status:"Fail"
        })        
    }
})

app.patch('/auth/updateprofile',verifyUserInfo, async(req,res)=>{
    const userId= req.user?.userId;
    const {firstName,lastName,emailAddress,userName} = req.body;
    try {
        const user = await client.user.update({
            where:{
                userId
            },
            data: {
                firstName: firstName && firstName,
                lastName: lastName && lastName,
                emailAddress: emailAddress && emailAddress,
                userName: userName && userName            }
        })   
        res.status(200) .json({
            message: "User updated successfully",
            user
        })
        
    } catch (error) {
        res.status(500).json({
            message: "An error occurred",
            status:"Fail",
            data: error
        })
        
    }
})

app.patch('/auth/updatepassword',[verifyUserInfo], async(req,res)=>{
    const userId= req.user?.userId;
    const {oldPassword,newPassword} = req.body;
    try {
        const user = await client.user.findFirst({
            where:{
                userId
            }
        })   
        const passwordMatch = await bcrypt.compare(oldPassword,user.password)
        if(!passwordMatch){
            return res.status(401).json({
                message:"Invalid password",
                status:"fail",
            })
        }
        const hashedPassword = await bcrypt.hash(newPassword,12);
        const updatedUser = await client.user.update({
            where:{
                userId
            },
            data: {
                password:hashedPassword
            }
        })   
        res.status(200) .json({
            message: "Password updated successfully",
            updatedUser
        })
        
    } catch (error) {
        res.status(500).json({
            message: "An error occurred",
            status:"Fail",
            data: error
        })
        
    }
})
            
            
app.delete('/auth/deleteprofile',verifyUserInfo, async(req,res)=>{
    const userId = req.user.userId
    console.log(userId)
    try {
        const user = await client.blogs.deleteMany({
            where:{
                userId
            }
         
        })
        const userDelete = await client.user.delete({
            where:{
                userId
            }
        })
        res.status(200).json({
            message:"User deleted successfully",
            status:"Success",
            data:user
        })
    } catch (error) {
        res.status(500).json({
            message:"Error deleting the user",
            status :"fail",
            data:error
          
        })        
    }
})

app.post('/blog/post',verifyUserInfo, async (req,res)=>{
    const userId = req.user.userId;
    const {blogTitle, blogExcerpt, blogBody} = req.body;      
   
    try{

        const post = await client.blogs.create({
            data: {
                userId,
                blogTitle,
                blogExcerpt,
                blogBody
            }
        })
        res.status(200).json({
            message:"Post created successfully",
            status:"Success",
            data:post
            
        })

    }catch (error) {
        res.status(500).json({
            message:"Error creating the post",
            status :"fail",
            
        })
    }
})


app.get('/blog/post/:blogId',verifyUserInfo, async(req,res)=>{    
    
    const userId = req.user.userId;
    const blogId = req.params.blogId;
   try {

    const post = await client.blogs.findFirst({
        where: {
            userId,
            blogId,
            isDeleted:false
        },     
    
   
    })
    if(!post){
        return res.status(404).json({
            message:"Post not found",
            status:"fail",
        })
    }
    res.status(200).json({
        message:"Post fetched successfully",
        status:"Success",
        data:post
    })
   } catch (error) {
    res.status(500).json({
        message:"Error fetching the post",
        status :"fail",
     
    })
    
   }
})


app.get('/blog/post',verifyUserInfo, async(req,res)=>{    
    const userId = req.user.userId;
    try {
        const posts = await client.blogs.findMany({
            where: {
                userId,
                isDeleted:false
            },     
    
   
        })
        res.status(200).json({    
            message:"Posts fetched successfully",
            status:"Success",
            data:posts
        })
    } catch (error) {
        res.status(500).json({    
            message:"Error fetching the posts",
            status :"fail", 
        })
    }
})

app.get('/blog/latest',verifyUserInfo, async(req,res)=>{
    try {
        const latestBlogs = await client.blogs.findMany({
            where: {
                isDeleted:false
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10,
            
            include: {
                user:{
                    select: {
                        userName: true,
                        
                    }
                }
                
            }

            
        })
        if(!latestBlogs || latestBlogs .length === 0){
            return res.status(404).json({
                message:"No blogs available",
                status:"fail",
            })
        }
        res.status(200).json({
            message:"Latest posts fetched successfully",
            status:"Success",
            data:latestBlogs
        })
        
    } catch (error) {
        res.status(500).json({
            message:"Error fetching the latest posts",
            status :"fail",
        })        
    }
})

app.patch('/blog/post/:blogId',verifyUserInfo, async(req,res)=>{

    const {blogTitle, blogExcerpt, blogBody}= req.body
    
    const userId = req.user.userId;
    const {blogId} =req.params
    
    try {

        const post = await client.blogs.update({
            where:{
                userId,
                blogId,
                isDeleted:false
            }
            ,data: {
                blogTitle: blogTitle && blogTitle,
                blogExcerpt: blogExcerpt && blogExcerpt,
                blogBody: blogBody && blogBody,
                updatedAt: new Date()
            }
        })
        if(!post){
            return res.status(404).json({
                message:"Post not found",
                status:"fail",
            })
        }
        res.status(200).json({
            message:"Post updated successfully",
            status:"Success",
            data:post
        })
        
    } catch (error) {
        res.status(500).json({
            message:"Error updating the post",
            status :"fail",
            data:error
        })        
    }

    
})

app.delete('/blog/post/:blogId',verifyUserInfo, async(req,res)=>{
    const userId = req.user.userId;
    const {blogId} = req.params
    console.log(userId)
    try {

        const deleteBlog = await client.blogs.delete({
            where:{
                userId,
                blogId,                
            }
        })

        res.status(200).json({
            message:"Post deleted successfully",
            status:"Success",
        })

    } catch (error) {
        res.status(500).json({
            message:"Error deleting the post",
            status :"fail",
            data:error
          
        })        
    }

})



