import zxcvbn from "zxcvbn";
export const checkPasswordStrength = async(req,res,next)=>{
    const {password}=req.body
    const passwordStrength = zxcvbn(password)
    if(passwordStrength.score<3){
        return res.status(400).json({
            message: "Password is weak",
            status: "fail",
        });
    }
    next();
  
}