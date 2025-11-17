import { supabase } from "../config/supabase.config.js";
import { v4 } from "uuid";
import { User } from "../model/user.model.js";
import { generateAccessToken, generateRefressToken } from "../services/token.js";




export const google = async (req, res) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
         queryParams: {
      response_type: 'code'
    },
        redirectTo: `${process.env.FRONTEND_URL}/api/auth/callback`,
      },
    });
    
    console.log(data);
    
    res.redirect(data.url);
  } catch (error) {
    throw error;
  }
};

export const varifyEmail = async (req, res) => {
  try {

    const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Token missing" });

        console.log(token);
        
        const { data, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ message: "Invalid token" });

    const supabaseUser = data.user;
    const [user,created] = await User.findOrCreate({
      where: { email: supabaseUser.email },
      defaults: {
        id: supabaseUser.id,
        email: supabaseUser.email,
      },
    });

    const AccessToken = await generateAccessToken({
        id:user.id,
        email:user.email
    },process.env.JWT_SECRET);

    const RefreshToken = await generateRefressToken({
        id:user.id,
        email:user.email,
    },process.env.JWT_SECRET);

    user.refreshToken = RefreshToken;
     await user.save();

    
    res.cookie("accessToken", AccessToken, { httpOnly: true, maxAge: 15*60*1000 });
      res.cookie("refreshToken", RefreshToken, { httpOnly: true, maxAge: 7*24*60*60*1000 });

      res.status(200).json({Message:"Login successful check your cookie"})


  } catch (error) {
    console.error(error);
  }
};

export const login = async (req,res)=>{
  const {email} = req.body;

  console.log('first step');
  

  if(!email) return res.status(400).json({Message:"Email not Provided"});

    const {error,data} = await supabase.auth.signInWithOtp({
      email:email,
      options:{
        emailRedirectTo: `${process.env.FRONTEND_URL}/api/auth/verify`
      }
    });

    res.send(data)
    
}
