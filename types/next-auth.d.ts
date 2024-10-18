import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import {userSchemaT} from '../src/app/models/models'

declare module "next-auth" {

    interface Session {
        user: {
            userId: number,
        } & DefaultSession["user"]
      }

}