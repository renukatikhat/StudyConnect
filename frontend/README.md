# 🎓 StudySpear — Student Community Platform

**Connect • Learn • Share • Grow**

StudySpear is a student-focused social media platform designed to help students connect, share knowledge, discuss academic doubts, and interact with fellow learners in one place.

## 🌐 Live Demo & GitHub Repository

- 🚀 **Live Website:** https://study-connect-iota.vercel.app/
- 💻 **GitHub Repository:** https://github.com/renukatikhat/StudyConnect

## ✨ Features

- 👤 Student Registration and Login
- 🔐 Secure Authentication using JWT
- 📝 Create and Share Posts
- ❤️ Like and Unlike Posts
- 💬 Comment on Posts
- 🤝 Follow and Unfollow Students
- 🎯 Student Profiles with Bio and Skills
- 🔎 Search Students
- 🗄️ MongoDB Database Integration
- 📱 Responsive User Interface

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend UI |
| Vite | Frontend development and build |
| HTML, CSS, JavaScript | User interface and interactions |
| Node.js | Backend runtime |
| Express.js | Backend API |
| MongoDB Atlas | Cloud database |
| Mongoose | MongoDB object modeling |
| JWT | Authentication |
| bcrypt | Password hashing |
| Vercel | Frontend deployment |
| Render | Backend deployment |

## 📂 Project Structure

```text
StudyConnect/
├── backend/
├── frontend/
│   └── src/
├── models/
├── routes/
├── package.json
└── package-lock.json
```

*Note: The actual folder structure may vary slightly depending on the project setup.*

## ⚙️ Getting Started

### Prerequisites

Install the following tools:

- Node.js and npm
- Git
- Visual Studio Code
- MongoDB Atlas account

### 1. Clone the Repository

```bash
git clone https://github.com/renukatikhat/StudyConnect.git
cd StudyConnect
```

### 2. Install Backend Dependencies

Navigate to the directory containing the backend's `package.json` file:

```bash
npm install
```

### 3. Install Frontend Dependencies

Open a separate terminal:

```bash
cd frontend
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the backend directory and configure the required environment variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Replace the example values with your own configuration. Never upload real database credentials or secret keys to GitHub.

### 5. Run the Application

Start the backend using the start command configured in the backend's `package.json`.

In a separate terminal, start the frontend:

```bash
cd frontend
npm run dev
```

Open the local URL displayed in the terminal.

## 🚀 Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

## 🎯 Project Objective

The objective of StudySpear is to create a collaborative learning environment where students can share knowledge, discuss academic doubts, and build connections with other learners.

## 🔮 Future Enhancements

- Real-time notifications
- Subject-based study communities
- Bookmarks for useful posts
- Improved accessibility and user experience

## 👩‍💻 Author

**Renuka Tikhat**

## 📄 License

This project was developed for educational and learning purposes.
