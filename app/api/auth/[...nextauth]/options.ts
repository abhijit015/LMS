import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateUser } from '../../../services/auth.service';


export const options: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Username and Password are Required.");
        }

        const user = await authenticateUser(credentials.email, credentials.password);

        if (user) {
          return user;
        } else {
          throw new Error("Invalid Credentials.");
        }
      },
    }),
  ],

  callbacks: {

    async jwt({ user, token }) {

      let userId: number = 0;

      if (user) {
        userId = user.id as unknown as number;
        console.log(user);
        token.userid = userId;
      }

      return token;  
    },

    async session({ session, token }) {
      if (token) {
        session.user.userId = token.userid as number;
      }
      return session;
    },

  },

  pages: {
    signIn: "/", 
  },
  session: {
    strategy: "jwt",  
  },
  jwt: {
    secret: process.env.JWT_SECRET,  
  },

};
