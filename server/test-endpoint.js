
import axios from "axios";

async function testEndpoint() {
    console.log("Testing POST /force-final...");
    const userId = "696a4096e08c9452c31cedb5";
    const specialist = "Heart Specialist";
    // Use the new BODY based route
    const url = `http://localhost:5050/api/chat/force-final`;

    console.log(`URL: ${url}`);

    try {
        const res = await axios.post(url, {
            userId: userId,
            specialization: specialist
        });
        console.log("✅ API Success:", res.status, res.data);
    } catch (error) {
        console.error("❌ API Failed:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
    }
}

testEndpoint();
