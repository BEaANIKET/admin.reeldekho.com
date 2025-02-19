import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


export const generateToken = async (data) => {
    const token = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '30d' });
    return token
}



passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    const email = profile.emails?.[0]?.value;
                    if (!email) {
                        throw new Error("Google account does not provide an email address.");
                    }

                    user = await User.findOne({ email });

                    if (!user) {
                        user = await User.create({
                            googleId: profile.id,
                            email,
                            fullName: profile.name?.givenName || profile.displayName || "Unknown",
                            profilePicture: profile.photos?.[0]?.value || "https://static.vecteezy.com/system/resources/thumbnails/048/334/475/small_2x/a-person-icon-on-a-transparent-background-png.png"
                        });
                    } else {
                        user.googleId = profile.id;
                        await user.save();
                    }
                }

                const token = await generateToken({ _id: user._id });

                return done(null, { user, token });
            } catch (error) {
                console.error("Error in Google OAuth strategy:", error.message);
                return done(error, null);
            }
        }
    )
);

export default passport;
