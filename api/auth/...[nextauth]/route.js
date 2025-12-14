import GoogleProvider from 'next-auth/providers/google'
import NextAuth from 'next-auth';

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientid: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
    ]
})