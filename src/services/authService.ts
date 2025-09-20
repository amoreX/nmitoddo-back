import bcrypt from "bcrypt";

export const loginUser = async (
  loginId: number,
  password: string,
): Promise<{ status: boolean; message: string }> => {
  // should be a valid loginId
  //
  return { status: true, message: "works" };
};

export const signupUser = async (
  email: string,
  password: string,
): Promise<boolean> => {
  // fetch user if exists or not

  // If user exists, throw error
  // if (existingUser) {
  //   throw new Error("User with this email already exists");
  // }

  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create new user

  return true;
};
