import * as z from "zod"

export const signUpSchema = z
  .object({
    email: z
    .string()
    .min(1,{message:"Please Enter Email"})
    .email({message:"Please Enter a Valid Email Address!"})
  })
