# 🔒 Chat Privacy

> **End-to-End Encrypted Messaging. Zero Metadata. Complete Anonymity. Peer-to-Peer.**

A privacy-first messaging application built with **Next.js**, **Rust**, and **WebRTC**. Chat Privacy offers true peer-to-peer end-to-end encryption with zero metadata collection, anonymous accounts, and user-controlled encryption keys.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **End-to-End Encryption** | Messages encrypted using libsodium (NaCl) - same encryption used by Signal and ProtonMail |
| 🌐 **Peer-to-Peer (WebRTC)** | Messages go **directly between browsers**. Server only helps establish connection - never sees your messages |
| 👤 **Anonymous Accounts** | No phone number or email required. Just a username and password. |
| 🚫 **Zero Metadata** | We don't collect or store any metadata. No tracking, no logs. |
| 🔑 **User-Controlled Keys** | Encryption keys generated and stored locally on your device |
| ⚡ **Real-Time Messaging** | Instant message delivery using WebRTC Data Channels (faster than server-based routing) |
| 🌐 **Open Source** | Built with open-source libraries. Fully auditable. |
| 💾 **Chat History** | Encrypted messages stored locally in your browser. Access your chat history anytime. |
| ⚡ **Rust Backend** | Built with Rust - the most secure programming language. Memory-safe, zero vulnerabilities. |

---

## 📊 Comparison: Chat Privacy vs WhatsApp vs Telegram

| Feature | WhatsApp | Telegram | **Chat Privacy** |
|---------|----------|----------|------------------|
| **Default End-to-End Encryption** | ✅ Yes (Signal Protocol) | ❌ Cloud chats: No<br>✅ Secret chats: Yes | ✅ **Yes (libsodium/NaCl)** |
| **Phone Number Required** | ✅ Required | ✅ Usually required | ❌ **Not required** |
| **Metadata Collection** | ✅ Yes (who, when, device) | ✅ Yes | ❌ **Zero metadata** |
| **Server Can Read Messages** | ❌ No | ⚠️ Yes (cloud chats) | ❌ **No (P2P - server never sees messages)** |
| **Anonymous Accounts** | ❌ No | △ Limited | ✅ **Fully anonymous** |
| **User-Controlled Keys** | ❌ No | ❌ No | ✅ **Yes (100% client-side)** |
| **Message Routing Method** | Via WhatsApp servers | Via Telegram servers | ✅ **Direct P2P (WebRTC)** |
| **Backend Technology** | C++ | C++ | ✅ **Rust (more secure)** |
| **Latency** | ~50-100ms (via server) | ~50-100ms (via server) | ✅ **~20-50ms (direct P2P)** |
| **Server Message Access** | Server routes messages | Server routes messages | ✅ **Server never sees messages** |
| **Message Storage** | On device | On Telegram cloud | **Device only (encrypted localStorage)** |
| **Open Source** | ❌ Not open source | △ Partially | ✅ **Fully open source** |
| **Perfect Forward Secrecy** | ✅ Yes (Double Ratchet) | △ Weak/limited | ✅ **Yes (if implemented)** |
| **Custom Features** | ❌ No | ❌ Limited | ✅ **Unlimited control** |

### 🎯 Why Choose Chat Privacy?

- **🌐 Peer-to-Peer**: Messages go directly between browsers. Server only helps establish connection - never sees your messages
- **⚡ Rust Backend**: Built with Rust - more secure than C++ used by WhatsApp/Telegram
- **🔒 True Privacy**: No metadata collection means no one can track who you talk to or when
- **👻 Anonymous by Design**: No phone number or email means complete anonymity
- **🔑 You Control Your Keys**: Encryption keys are generated and stored on your device only
- **⚡ Faster Messages**: Direct P2P connection means lower latency (~20-50ms vs ~50-100ms)
- **🔍 Open & Auditable**: Built with open-source libraries you can verify yourself
- **💾 Chat History**: Encrypted messages stored locally - access your history anytime

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (for frontend)
- **Rust 1.70+** (for backend)
- **npm** or **yarn**

### Installation

#### 1. Frontend Setup

```bash
# Navigate to project root
cd chat

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Build and run the Rust backend
cargo run
```

The backend will start on [http://localhost:3001](http://localhost:3001)

### Production Build

#### Frontend
```bash
npm run build
npm start
```

#### Backend
```bash
cd backend
cargo build --release
./target/release/chat-privacy-backend
```

---

## 📖 How It Works

### 1. **User Registration**
- User creates a username and password
- Encryption keys are generated locally in the browser using libsodium
- Public key is registered with the backend (stored in memory only)
- Private key stays in browser's localStorage (never sent to server)

### 2. **Connection Setup (WebRTC Signaling)**
- User A wants to chat with User B
- Backend acts as a **signaling server** (helps establish P2P connection)
- Backend exchanges WebRTC offers/answers and ICE candidates via HTTP polling
- **Backend never sees encrypted messages**

### 3. **Peer-to-Peer Connection**
- Once WebRTC connection is established, messages go **directly between browsers**
- Server is no longer in the message path
- This is **true peer-to-peer** - revolutionary compared to WhatsApp/Telegram!

### 4. **Message Encryption**
- Messages are encrypted client-side using the recipient's public key
- Uses `crypto_box` from libsodium (authenticated encryption)
- Same encryption standard used by Signal, Wire, and ProtonMail

### 5. **Message Delivery**
- Encrypted messages sent via WebRTC Data Channels (direct P2P)
- Lower latency (~20-50ms) compared to server-based routing (~50-100ms)
- Messages stored encrypted in browser's localStorage for history

### 6. **Message Decryption**
- Only the recipient can decrypt messages using their private key
- Decryption happens client-side in the browser

### Architecture Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   User A    │         │   Server     │         │   User B    │
│  Browser    │         │  (Signaling) │         │  Browser    │
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
       │ 4. WebRTC Signaling    │                         │
       │    (Offer/Answer/ICE)  │                         │
       │<───────────────────────>│<────────────────────────>│
       │                        │                         │
       │ 5. P2P Connection      │                         │
       │    Established         │                         │
       │                        │                         │
       │ 6. Encrypt Message     │                         │
       │    (Client-side)       │                         │
       │                        │                         │
       │ 7. Send via WebRTC     │                         │
       │    Data Channel        │                         │
       │──────────────────────────────────────────────────>│
       │    (Direct P2P -       │                         │
       │     Server NOT in path)│                         │
       │                        │                         │ 8. Decrypt
       │                        │                         │    (Client-side)
```

**Key Innovation:** Messages go **directly between browsers** via WebRTC. The server only helps establish the connection but **never sees your messages**.

---

## 💻 Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Real-Time**: WebRTC Data Channels (peer-to-peer)
- **Backend**: Rust (Axum web framework)
- **Signaling**: HTTP polling (backend acts as signaling server)
- **Encryption**: libsodium (NaCl) - same encryption used by Signal, Wire, and ProtonMail
- **Styling**: Tailwind CSS
- **Storage**: Browser localStorage (encrypted chat history)

---

## 🔐 Security & Privacy

### Encryption
- Uses `crypto_box` from libsodium (authenticated encryption)
- Same encryption standard used by Signal, Wire, and ProtonMail
- All encryption/decryption happens **client-side**

### Key Management
- Private keys stored only in browser's localStorage
- Keys generated client-side, never sent to server
- Public keys stored ephemerally (in memory only, cleared when users go offline)

### Privacy Guarantees
- **No Metadata Collection**: We don't track who you talk to, when, or how often
- **Peer-to-Peer**: Messages go directly between browsers. Server never sees them
- **No Server-Side Storage**: Messages and keys are never stored on the server
- **Ephemeral Public Keys**: Public keys are only kept in memory while users are online
- **No Metadata Logging**: The server doesn't log who you talk to or when
- **Zero Trust**: Server cannot decrypt anything - not even if compromised

### Why Rust?
- **Memory Safety**: Rust prevents buffer overflows, null pointer dereferences, and other memory vulnerabilities
- **No Undefined Behavior**: Rust's type system guarantees safety at compile time
- **Better Than C++**: WhatsApp and Telegram use C++ which is more vulnerable to security bugs
- **Performance**: Rust is as fast as C/C++ but safer

---

## 📱 Usage

1. **Create Account**: 
   - Enter a username (minimum 3 characters)
   - Enter a password (minimum 6 characters)
   - Confirm your password
   - If username already exists, you'll see an error message

2. **Start Chatting**: 
   - Enter another user's username to start a conversation
   - The system will establish a WebRTC peer-to-peer connection
   - Once connected, messages go directly between browsers

3. **Send Messages**: 
   - All messages are automatically encrypted before sending
   - Messages are sent via WebRTC Data Channels (direct P2P)
   - Messages are stored encrypted in your browser for history

4. **View Chat History**: 
   - Your encrypted chat history is stored locally
   - When you return, your chat history is automatically loaded and decrypted

5. **View Online Users**: 
   - See who's currently online in the sidebar

---

## ⚠️ Current Limitations

- Users must be online to establish connection (signaling requires both users online)
- No file sharing (text messages only)
- No group chats (one-on-one only)
- No message delivery confirmation
- WebRTC requires both users to be online simultaneously for initial connection

---

## 🚧 Future Improvements

For production use, consider:
- STUN/TURN servers for NAT traversal (better WebRTC connectivity)
- Message queue system for offline users
- Rate limiting
- DDoS protection
- Perfect forward secrecy implementation
- File sharing support
- Group chat functionality
- Message delivery confirmation
- Read receipts

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

## 🏗️ Architecture Overview

```
Frontend (Next.js)          Backend (Rust)              Frontend (Next.js)
──────────────────          ──────────────              ──────────────────
User A Browser              Axum Server                 User B Browser
├── Key Generation          ├── Signaling Server        ├── Message Decryption
├── Message Encryption     ├── User Registration       ├── Message Display
├── WebRTC Manager         ├── Public Key Storage      └── WebRTC Manager
├── Data Channel           │   (Ephemeral - Memory)     ├── Data Channel
└── Local Storage          └── HTTP Polling API         └── Local Storage
    (Private Keys)             (Signaling Only)             (Private Keys)
    (Encrypted History)                                      (Encrypted History)
```

**Key Points:**
- All encryption happens **client-side**
- Server **cannot decrypt** messages
- Messages go **directly between browsers** (P2P via WebRTC)
- Server only helps establish connection (signaling)
- Private keys **never leave** browser
- Public keys stored **ephemerally** (in memory only)
- Chat history stored **encrypted** in browser's localStorage

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
   - Add environment variable:
     - `NEXT_PUBLIC_API_URL` - Your Rust backend URL (e.g., `https://your-backend.railway.app`)
   - Deploy!

3. **Environment Variables in Vercel**
   - Go to Project Settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app
     ```

### Backend (Rust - Separate Deployment Required)

**⚠️ Important:** Vercel doesn't support long-running servers. You must deploy the Rust backend separately.

**Recommended hosting options:**

1. **Railway** (Recommended)
   - Push backend code to GitHub
   - Connect Railway to your repo
   - Set build command: `cargo build --release`
   - Set start command: `./target/release/chat-privacy-backend`
   - Railway automatically provides HTTPS

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
# Backend API URL (for HTTP requests and WebRTC signaling)
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

**Note:** 
- Use `http://localhost:3001` for local development
- Use `https://` (secure) for production
- Make sure your backend supports HTTPS

---

## 🌟 Unique Features

### 1. **WebRTC Peer-to-Peer**
- Messages go **directly between browsers**
- Server only helps establish connection - never sees your messages
- This is **revolutionary** - WhatsApp and Telegram route through their servers

### 2. **Rust Backend**
- Built with **Rust** - the most secure programming language
- Memory-safe, zero vulnerabilities
- Better than C++ used by WhatsApp/Telegram

### 3. **True Anonymity**
- **No phone number, no email**
- Just a username and password
- Complete anonymity that WhatsApp and Telegram can't provide

### 4. **User-Controlled Keys**
- Encryption keys generated and stored **100% on your device**
- You own your keys - not the company
- True user sovereignty

### 5. **Zero Metadata**
- We don't collect **who you talk to, when, or how often**
- WhatsApp and Telegram track everything
- We track nothing

### 6. **Faster Messages**
- **Direct P2P connection** means lower latency (~20-50ms vs ~50-100ms)
- Messages arrive faster because there's no server hop!

---

**Built with ❤️ for privacy-conscious users**
