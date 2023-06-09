const Admin = require('../models/admin')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Version = require('../models/version')
require('dotenv').config()


const register = async (req, res) => {
    try {
        const { username, password } = req.body
        const hashedPassword = await bcrypt.hash(password, 10)
        const admin = await Admin.create({
            username,
            password: hashedPassword
        })
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '24h' })
        res.status(201).json({ message: "admin created", username: admin.username, token })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message })
    }
}

const login = async (req, res) => {
    try {
        const { username, password } = req.body
        const admin = await Admin.findOne({ username })
        if (!admin) return res.status(401).json({ message: "Invalid Username" })
        const isValid = await bcrypt.compare(password, admin.password)
        if (!isValid) return res.status(401).json({ message: "invalid Password" })
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '24h' })
        res.status(200).json({ message: "admin logged in", username: admin.username, token })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const getUsers = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const admin = await Admin.findOne({ _id: decoded.id })
        if (!admin) return res.status(401).json({ message: "Unauthorized" })
        const users = await User.find({})
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const getUser = async (req, res) => {
    try {
        const { id } = req.params
        const token = req.headers.authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const admin = await Admin.findOne({ _id: decoded.id })
        if (!admin) return res.status(401).json({ message: "Unauthorized" })
        const user = await User.findOne({ _id: id })
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const getAnalytics = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const admin = await Admin.findOne({ _id: decoded.id })
        if (!admin) return res.status(401).json({ message: "Unauthorized" })
        const users = await User.find();
        let _todayUser = []
        users.find((user) => {
            const todayDate = new Date().getDate() + '-' + new Date().getMonth() + '-' + new Date().getFullYear();
            const userDate = new Date(user.createdAt).getDate() + '-' + new Date(user.createdAt).getMonth() + '-' + new Date(user.createdAt).getFullYear();
            if (userDate == todayDate) {
                _todayUser.push(user);
            }
        })

        let totalMinedBalance = 0
        users.forEach(user => {
            totalMinedBalance += user.balance.minedBalance + user.balance.referralBalance
        })
        res.status(200).json({ totalRegisteredUsers: users.length, totalRegisteredUsersToday: _todayUser.length, totalMinedBalance })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const addVersion = async (req, res) => {
    try {
        const { version } = req.body
        const token = req.headers.authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const admin = await Admin.findOne({ _id: decoded.id })
        if (!admin) return res.status(401).json({ message: "Unauthorized" })
        await Version.create({ version });
        res.status(200).json({ message: "New version available" })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const getLatestVersion = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1]
        if (!token) return res.status(401).json({ message: "Unauthorized" })
        const latestVersion = await Version.find({}).sort({ "createdAt": -1 })
        res.status(200).json(latestVersion[0])
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}



module.exports = { register, login, getUsers, getUser, getAnalytics, addVersion, getLatestVersion }
