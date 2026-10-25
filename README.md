# StudySpear – Student Social Media Platform

StudySpear is a student-focused social media platform where students can connect, share posts, like and comment on posts, and explore a learning community.

## 🌐 Live Demo

**Website:** https://study-connect-iota.vercel.app/

## 💻 GitHub Repository

**Source Code:** https://github.com/renukatikhat/StudyConnect

## ✨ Features

- Student registration and login
- Secure authentication using JWT
- Create and share posts
- Like and comment on posts
- Student profiles
- Search and connect with students
- Responsive user interface
- MongoDB database integration

## 🛠️ Tech Stack

**Frontend**
- React.js
- Vite
- HTML
- CSS
- JavaScript

**Backend**
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- bcryptjs

## 📁 Project Structure

```text
StudyConnect/
├── backend/
├── frontend/
├── models/
├── routes/
├── package.json
└── README.md
```

## 🚀 Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/renukatikhat/StudyConnect.git
cd StudyConnect
```

### 2. Install backend dependencies

Open a terminal in the backend directory and install the dependencies according to the backend `package.json`.

### 3. Configure environment variables

Create a `.env` file in the backend directory and configure the required values:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

Use your own MongoDB connection string and a secure JWT secret. Never upload your real `.env` file to GitHub.

### 4. Start the backend

Run the start command defined in the backend `package.json`.

### 5. Start the frontend

Open another terminal in the frontend directory, install its dependencies, and run:

```bash
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## 🎯 Project Objective

The objective of StudySpear is to provide a platform where students can interact, share knowledge, and build connections within a learning community.

## 🔮 Future Enhancements

- Real-time chat
- Notifications
- Study groups
- Improved profile customization

## 👩‍💻 Developer

**Renuka Tikhat**

Computer Science and Engineering Student
