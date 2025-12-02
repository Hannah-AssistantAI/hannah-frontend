/**
 * Quick test to verify GET conversation API returns metadata
 * Run in browser console on http://localhost:5173/chat
 */

// Test function - paste this into browser console
async function testConversationMetadata() {
  console.log("🧪 Testing Conversation API for Metadata");
  console.log("=".repeat(80));

  // Get token and user from localStorage
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token || !user.userId) {
    console.error("❌ Not logged in! Please login first.");
    return;
  }

  // Get conversation ID - prompt user or use from URL
  let conversationId = prompt("Enter Conversation ID to test:", "5");
  conversationId = parseInt(conversationId);

  console.log(`📝 Testing Conversation ID: ${conversationId}`);
  console.log(`👤 User ID: ${user.userId}`);
  console.log("=".repeat(80));

  try {
    const response = await fetch(
      `http://localhost:8001/api/v1/conversations/${conversationId}?user_id=${user.userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`📊 Status: ${response.status}`);

    if (response.status !== 200) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error("Response:", text.substring(0, 300));
      return;
    }

    const data = await response.json();
    const messages = data.data.messages || [];

    console.log(`✅ Response OK - ${messages.length} messages`);
    console.log("=".repeat(80));

    // Find assistant messages
    const assistantMsgs = messages.filter((m) => m.role === "assistant");
    console.log(`🤖 Assistant Messages: ${assistantMsgs.length}`);

    if (assistantMsgs.length === 0) {
      console.warn("⚠️  No assistant messages to check!");
      return;
    }

    // Check first assistant message
    const first = assistantMsgs[0];
    console.log("\n📋 First Assistant Message Check:");
    console.log("─".repeat(80));
    console.log(`Message ID: ${first.messageId}`);

    const checks = {
      metadata: "metadata" in first,
      interactiveElements: "interactiveElements" in first,
      images: "images" in first,
      sources: "sources" in first,
    };

    console.log("\n✓ Field Presence:");
    Object.entries(checks).forEach(([field, present]) => {
      console.log(
        `  ${present ? "✅" : "❌"} ${field}: ${present ? "YES" : "NO"}`
      );
    });

    // Detailed check
    if (checks.metadata) {
      const md = first.metadata;
      console.log("\n📦 metadata content:");
      if (md && typeof md === "object") {
        console.log(`  Keys: ${Object.keys(md).join(", ")}`);
        if (md.interactive_elements) {
          console.log(
            `  ✓ interactive_elements: ${Object.keys(
              md.interactive_elements
            ).join(", ")}`
          );
        }
      }
    }

    if (checks.interactiveElements) {
      const ie = first.interactiveElements;
      console.log("\n🎯 interactiveElements content:");
      if (ie && typeof ie === "object") {
        console.log(`  Keys: ${Object.keys(ie).join(", ")}`);
        if (ie.suggested_questions)
          console.log(
            `  • suggested_questions: ${ie.suggested_questions.length} items`
          );
        if (ie.interactive_list)
          console.log(
            `  • interactive_list: ${ie.interactive_list.length} items`
          );
        if (ie.outline) console.log(`  • outline: ${ie.outline.length} items`);
      }
    }

    // Verdict
    console.log("\n" + "=".repeat(80));
    console.log("🎯 VERDICT:");
    console.log("=".repeat(80));

    const passAll = checks.metadata && checks.interactiveElements;
    const passPartial = checks.metadata || checks.interactiveElements;

    if (passAll) {
      console.log(
        "%c✅ SUCCESS!",
        "color: green; font-size: 16px; font-weight: bold"
      );
      console.log("Both metadata and interactiveElements present");
      console.log("Frontend will receive data correctly on reload!");
    } else if (passPartial) {
      console.log(
        "%c⚠️  PARTIAL",
        "color: orange; font-size: 16px; font-weight: bold"
      );
      console.log("Only one field present - check backend mapping");
    } else {
      console.log(
        "%c❌ FAILED",
        "color: red; font-size: 16px; font-weight: bold"
      );
      console.log("Neither metadata nor interactiveElements present");
      console.log("Backend not returning metadata from DTO");
    }

    console.log("\n📄 Full first assistant message:");
    console.log(first);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Instructions
console.log("📖 INSTRUCTIONS:");
console.log("1. Make sure you are logged in at http://localhost:3000");
console.log("2. Copy this entire file content");
console.log("3. Open browser DevTools (F12) → Console tab");
console.log("4. Paste and press Enter");
console.log("5. Run: testConversationMetadata()");
console.log("");
console.log("Or run directly:");
console.log("testConversationMetadata()");
