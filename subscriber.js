// subscriber.js - Subscriber Client
const io = require("socket.io-client");
const readline = require("readline");

// Server se connect karo
const socket = io("http://localhost:3000");

// CLI input setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "sub> ",
});

let currentTopic = null; // currently subscribed topic

console.log("\n👂 Subscriber Client Started");
console.log("=================================");
console.log("Commands:");
console.log("  join <topic> <key>  - Subscribe to a topic");
console.log("  leave               - Unsubscribe from current topic");
console.log("  status              - Show current subscription");
console.log("  exit                - Quit");
console.log("=================================\n");

// Connection successful
socket.on("connect", () => {
  console.log("✅ Connected to broker server");
  console.log('💡 Use "join <topic> <key>" to subscribe to a topic\n');
  rl.prompt();
});

// Connection error
socket.on("connect_error", (err) => {
  console.log("❌ Connection failed! Make sure server is running on port 3000");
  process.exit(1);
});

// Naya message receive hone par
socket.on("newMessage", (data) => {
  console.log("\n📨 [NEW MESSAGE]");
  console.log(`   Topic: ${data.topic}`);
  console.log(`   Message: ${data.message}`);
  console.log(`   Time: ${data.timestamp}`);
  console.log("─────────────────────────────");
  rl.prompt();
});

// Server se response
socket.on("response", (data) => {
  if (data.success) {
    console.log(`✅ ${data.message}`);
    if (data.message.includes("Subscribed")) {
      // Agar subscribe successful hai to topic name extract karo
      const match = data.message.match(/'([^']+)'/);
      if (match) {
        currentTopic = match[1];
      }
    }
  } else {
    console.log(`❌ ${data.message}`);
  }
  rl.prompt();
});

// User input handle karna
rl.on("line", (line) => {
  const input = line.trim();
  const parts = input.split(" ");
  const command = parts[0].toLowerCase();

  switch (command) {
    case "join":
      // Topic join karo (subscribe)
      if (parts.length < 3) {
        console.log("❌ Usage: join <topicname> <key>");
        console.log("   Example: join sports football123");
      } else {
        const topicName = parts[1];
        const key = parts[2];

        socket.emit("subscribe", { topicName, key }, (response) => {
          if (response.success) {
            console.log(`✅ Successfully subscribed to '${topicName}'`);
            console.log(`💡 You will now receive messages from this topic`);
            currentTopic = topicName;
          } else {
            console.log(`❌ Failed to subscribe: ${response.message}`);
          }
          rl.prompt();
        });
      }
      break;

    case "leave":
      // Current topic se unsubscribe
      if (!currentTopic) {
        console.log("❌ You are not subscribed to any topic");
      } else {
        console.log(`🗑️ Leaving topic: ${currentTopic}`);
        console.log("💡 To unsubscribe, just disconnect or restart the client");
        console.log('   Or use "exit" and reconnect to join different topic');
        currentTopic = null;
      }
      rl.prompt();
      break;

    case "status":
      // Current status dikhao
      if (currentTopic) {
        console.log(`✅ Currently subscribed to: ${currentTopic}`);
        console.log("💡 You will receive all messages from this topic");
      } else {
        console.log("❌ Not subscribed to any topic");
        console.log("💡 Use: join <topicname> <key>");
      }
      rl.prompt();
      break;

    case "exit":
      console.log("👋 Goodbye!");
      socket.disconnect();
      rl.close();
      process.exit(0);
      break;

    default:
      console.log("❌ Unknown command! Available: join, leave, status, exit");
      rl.prompt();
  }
});

// Ctrl+C handle
rl.on("SIGINT", () => {
  console.log("\n👋 Goodbye!");
  socket.disconnect();
  process.exit(0);
});

// Disconnect par cleanup
socket.on("disconnect", () => {
  console.log("🔌 Disconnected from broker server");
});
