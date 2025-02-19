
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: ['https://reeldekho.com', 'https://www.reeldekho.com', 'reeldekho.com', 'http://localhost:5173'],
        credentials: true,
    },
})

export const getUserSocketId = (userId) => {
    return userSocketMap[userId]
}
const userSocketMap = {}

io.on('connection', (socket) => {
    console.log('New client connected', socket.id)

    const userId = socket?.handshake?.query?.userId
    if (userId !== undefined) {
        userSocketMap[userId] = socket?.id
    }

    socket.on('registerUser', (data) => {
        console.log("user register for ", data.userId);

        if (data?.userId && data.userId !== undefined) {
            console.log("with socket for ", socket.id);

            userSocketMap[data.userId] = socket.id
        }
    })

    socket.on('disconnect', () => {
        console.log("disconnect", socket.id);
        delete userSocketMap[userId]
    })
})



export {
    app, io, server
}