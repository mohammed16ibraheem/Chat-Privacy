# 🔒 Chat Privacy

> **End-to-End Encrypted Messaging. Zero Metadata. Complete Anonymity.**

A privacy-first messaging application built with Next.js, Socket.IO, and libsodium. Chat Privacy offers true end-to-end encryption with zero metadata collection, anonymous accounts, and user-controlled encryption keys.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **End-to-End Encryption** | Messages encrypted using libsodium (NaCl) - same encryption used by Signal and ProtonMail |
| 👤 **Anonymous Accounts** | No phone number or email required. Just a username. |
| 🚫 **Zero Metadata** | We don't collect or store any metadata. No tracking, no logs. |
| 🔑 **User-Controlled Keys** | Encryption keys generated and stored locally on your device |
| ⚡ **Real-Time Messaging** | Instant message delivery using WebSocket technology |
| 🌐 **Open Source** | Built with open-source libraries. Fully auditable. |
| 💾 **Ephemeral Storage** | Public keys stored only in memory. No persistent storage. |

---

## 📊 Comparison: Chat Privacy vs WhatsApp vs Telegram

| Feature | WhatsApp | Telegram | **Chat Privacy** |
|---------|----------|----------|------------------|
| **Default End-to-End Encryption** | ✅ Yes (Signal Protocol) | ❌ Cloud chats: No<br>✅ Secret chats: Yes | ✅ **Yes (libsodium/NaCl)** |
| **Phone Number Required** | ✅ Required | ✅ Usually required | ❌ **Not required** |
| **Metadata Collection** | ✅ Yes (who, when, device) | ✅ Yes | ❌ **Zero metadata** |
| **Server Can Read Messages** | ❌ No | ⚠️ Yes (cloud chats) | ❌ **No** |
| **Anonymous Accounts** | ❌ No | △ Limited | ✅ **Fully anonymous** |
| **User-Controlled Keys** | ❌ No | ❌ No | ✅ **Yes (100% client-side)** |
| **Message Storage** | On device | On Telegram cloud | **Device only (ephemeral)** |
| **Open Source** | ❌ Not open source | △ Partially | ✅ **Fully open source** |
| **Perfect Forward Secrecy** | ✅ Yes (Double Ratchet) | △ Weak/limited | ✅ **Yes (if implemented)** |
| **Custom Features** | ❌ No | ❌ Limited | ✅ **Unlimited control** |

### 🎯 Why Choose Chat Privacy?

- **🔒 True Privacy**: No metadata collection means no one can track who you talk to or when
- **👻 Anonymous by Design**: No phone number or email means complete anonymity
- **🔑 You Control Your Keys**: Encryption keys are generated and stored on your device only
- **🔍 Open & Auditable**: Built with open-source libraries you can verify yourself
- **☁️ No Cloud Storage**: Messages are ephemeral - no permanent storage on servers

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## 📖 How It Works

### 1. **Key Generation**
When you create an account, encryption keys are generated locally in your browser using libsodium.

### 2. **Key Storage**
Your private key never leaves your device. It's stored securely in your browser's localStorage.

### 3. **Message Encryption**
Messages are encrypted client-side using the recipient's public key before being sent.

### 4. **Message Routing**
The server only routes encrypted messages. It cannot decrypt or read them.

### 5. **Message Decryption**
Only the recipient can decrypt messages using their private key.

### Architecture Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   User A    │         │   Server     │         │   User B    │
│  Browser    │         │  (Socket.IO) │         │  Browser    │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                        │                         │
       │ 1. Generate Keys      │                         │
       │    (Client-side)      │                         │
       │                        │                         │
       │ 2. Register Public Key│                         │
       │───────────────────────>│                         │
       │                        │                         │
       │                        │ 3. Get B's Public Key  │
       │                        │<────────────────────────│
       │                        │                         │
       │ 4. Encrypt Message     │                         │
       │    (Client-side)       │                         │
       │                        │                         │
       │ 5. Send Encrypted      │                         │
       │───────────────────────>│                         │
       │                        │ 6. Forward Encrypted    │
       │                        │────────────────────────>│
       │                        │                         │ 7. Decrypt
       │                        │                         │    (Client-side)
```

---

## 💻 Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Real-Time**: Socket.IO
- **Encryption**: libsodium (NaCl) - same encryption used by Signal, Wire, and ProtonMail
- **Styling**: Tailwind CSS

---

## 🔐 Security & Privacy

### Encryption
- Uses `crypto_box` from libsodium (authenticated encryption)
- Same encryption standard used by Signal, Wire, and ProtonMail

### Key Management
- Private keys stored only in browser's localStorage
- Keys generated client-side, never sent to server
- Public keys stored ephemerally (in memory only)

### Privacy Guarantees
- **No Metadata Collection**: We don't track who you talk to, when, or how often
- **No Server-Side Storage**: Messages and keys are never stored on the server
- **Ephemeral Public Keys**: Public keys are only kept in memory while users are online
- **No Metadata Logging**: The server doesn't log who you talk to or when

---

## 📱 Usage

1. **Create Account**: Enter a username (minimum 3 characters)
2. **Start Chatting**: Enter another user's username to start a conversation
3. **Send Messages**: All messages are automatically encrypted before sending
4. **View Online Users**: See who's currently online in the sidebar

---

## ⚠️ Current Limitations

- Users must be online to receive messages (in-memory storage)
- No message history persistence
- No file sharing
- No group chats
- No message delivery confirmation

---

## 🚧 Future Improvements

For production use, consider:
- Redis for ephemeral key storage
- Message queue system
- Rate limiting
- DDoS protection
- Perfect forward secrecy implementation
- Message history persistence
- File sharing support
- Group chat functionality

---

## 📄 License

MIT License - feel free to use this project for learning or building your own privacy-focused messaging app.

---

## ⚠️ Disclaimer

This is a demonstration project. For production use, please conduct a security audit and consider additional hardening measures.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Contact

- **Telegram**: [@I_am_codeing](https://t.me/I_am_codeing)
- **Project**: Chat Privacy - End-to-end encrypted messaging

---

## 📚 Documentation

- **[Architecture Guide](./backend/ARCHITECTURE.md)** - Complete system architecture
- **[Encryption Flow](./ENCRYPTION_FLOW.md)** - Detailed encryption documentation
- **[Backend README](./backend/README.md)** - Rust backend documentation

---

## 🏗️ Architecture Overview

```
Frontend (Next.js)          Backend (Rust)              Frontend (Next.js)
──────────────────          ──────────────              ──────────────────
User A Browser              Axum Server                 User B Browser
├── Key Generation          ├── WebSocket Server        ├── Message Decryption
├── Message Encryption     ├── Connection Manager       ├── Message Display
├── WebSocket Client        ├── Message Router          └── WebSocket Client
└── Local Storage          └── Ephemeral Storage
    (Private Keys)             (Public Keys Only)
```

**Key Points:**
- All encryption happens **client-side**
- Server **cannot decrypt** messages
- Private keys **never leave** browser
- Public keys stored **ephemerally** (in memory)

---

## 🚀 Deployment

### Frontend (Vercel)

The frontend can be deployed to Vercel:

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_API_URL` - Your Rust backend URL (e.g., `https://your-backend.railway.app`)
     - `NEXT_PUBLIC_WS_URL` - Your WebSocket URL (e.g., `wss://your-backend.railway.app/api/ws`)
   - Deploy!

3. **Environment Variables in Vercel**
   - Go to Project Settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app
     NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app/api/ws
     ```

### Backend (Rust - Separate Deployment Required)

**⚠️ Important:** Vercel doesn't support long-running WebSocket servers. You must deploy the Rust backend separately.

**Recommended hosting options:**

1. **Railway** (Recommended)
   - Push backend code to GitHub
   - Connect Railway to your repo
   - Set build command: `cargo build --release`
   - Set start command: `./target/release/chat-privacy-backend`
   - Railway automatically provides HTTPS and WebSocket support

2. **Fly.io**
   - Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
   - Run: `fly launch` in the `backend` directory
   - Follow prompts to deploy

3. **Render**
   - Create a new Web Service
   - Connect your GitHub repo
   - Set build command: `cd backend && cargo build --release`
   - Set start command: `cd backend && ./target/release/chat-privacy-backend`

4. **VPS (DigitalOcean, AWS, etc.)**
   - SSH into your server
   - Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
   - Clone repo and build: `cd backend && cargo build --release`
   - Run: `./target/release/chat-privacy-backend`

### Environment Variables

Create a `.env.local` file (or set in your hosting platform):

```env
# Backend API URL (for HTTP requests)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# WebSocket URL (for real-time chat)
# Use wss:// (secure) for production, ws:// for local development
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app/api/ws
```

**Note:** 
- Use `ws://` for local development
- Use `wss://` (secure WebSocket) for production
- Make sure your backend supports HTTPS/WSS

---

**Built with ❤️ for privacy-conscious users**
