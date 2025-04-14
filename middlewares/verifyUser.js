
import jwt from 'jsonwebtoken'
export const verifyUserInfo=(req,res,next)=>{

    const token = req.cookies.token
    
    jwt.verify(token,process.env.JWT_SECRET_KEY,(err,user)=>{
        if(err){
           return res.status(403).json({
                message:"Please login",
                status:"fail",
            })
        }else{
            req.user=user
            next()
        }
        
    })
        
    }    
