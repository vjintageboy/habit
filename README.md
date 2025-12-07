# 📋 On-Chain Habit Tracker

A decentralized application (dApp) for building and tracking habits on the **IOTA Blockchain**. 

Built with **Next.js**, **Radix UI**, and **Move**, this project demonstrates how to create a full-stack dApp where user data is stored securely and permanently on-chain.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🌟 Why This Project?

Traditional habit trackers store your data on centralized servers. **Habit Tracker** leverages the power of blockchain to give you:

- **Ownership**: You own your habit data (as on-chain Objects).
- **Permanence**: Your streak history is immutable and stored forever on the IOTA Devnet.
- **Transparence**: Verify every check-in via the IOTA Explorer.

## ✨ Key Features

- **Create Habits**: Define habits with custom names, emojis, and goals (Daily, Weekly, Monthly).
- **Check-In**: Record daily progress with optional notes. Each check-in is a blockchain transaction.
- **Track Statistics**: View streak counts, total check-ins, and completion rates.
- **Edit & Delete**: Modify habit details or delete them (with Storage Rebate!).
- **Wallet Integration**: Seamlessly connect with the IOTA Wallet Extension.

## 🚀 Getting Started

Follow these steps to get the project running on your local machine.

### Prerequisites

1.  **Node.js** (v18 or higher)
2.  **IOTA CLI**: [Install Guide](https://docs.iota.org)
3.  **IOTA Wallet Extension**: Installed in your browser.

### 🛠️ Installation

1.  **Clone the repository** (if applicable) or navigate to the project folder:
    ```bash
    cd habit
    ```

2.  **Install dependencies**:
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **Deploy the Smart Contract**:
    This command builds the Move contract and publishes it to the IOTA Devnet. It also automatically updates `lib/config.ts` with the new Package ID.
    ```bash
    npm run iota-deploy
    ```
    > **Note**: Make sure your IOTA CLI is configured for `devnet` and has gas tokens (`iota client gas`).

4.  **Start the Development Server**:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

1.  **Connect Wallet**: Click the "Connect Wallet" button in the top right. Select your account.
2.  **Create a Habit**: Click "+ New Habit". Enter a name (e.g., "Morning Jog"), an emoji 🏃, and set your goal.
3.  **Approve Transaction**: Your wallet popup will appear. Click **Approve** to pay the small gas fee.
4.  **Check In**: Once created, click "Check In" on your habit card. You can add a note like "Ran 5km today!".
5.  **View Stats**: Watch your streaks and statistics update in real-time!

## 📁 Project Structure

```
habit/
├── app/                  # Next.js App Router pages
├── components/           # React UI components
│   ├── habits/           # Habit-specific components (Card, List, Modals)
│   └── ...
├── contract/             # Move smart contract code
│   └── habit/
│       └── sources/      # habit.move (The blockchain logic)
├── hooks/                # Custom React hooks
│   └── useHabit.ts       # Core logic for interacting with the contract
├── lib/                  # Configuration and utilities
└── public/               # Static assets
```

## 📚 Resources

- **[Instruction Guide](./INSTRUCTION_GUIDE.md)**: Detailed step-by-step setup guide.
- **[Troubleshooting](./FIX_CHECKIN.md)**: Solutions for common issues like transaction failures.
- **[IOTA Documentation](https://wiki.iota.org/)**: Learn more about developing on IOTA.
- **[Contract Address](https://explorer.iota.org/object/0x80a377b0e64fbc25363844ee3fa0194e876a65b65c9a61a0cedc378518a93834?network=devnet)**:


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
