import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserType } from "../shared/types";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
});

userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      if (!this.password || typeof this.password !== 'string') {
        throw new Error('Invalid password');
      }
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

const User = mongoose.model<UserType>("User", userSchema);

export default User;
