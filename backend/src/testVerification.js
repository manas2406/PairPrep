const axios = require("axios");

async function triggerVerification() {
    try {
        const res = await axios.post("http://localhost:4000/submission/submit", {
            roomId: "fake_room",
            submissionId: "365641573"
        }, {
            headers: {
                "x-socket-id": "fake_socket" // Requires mocking socket or tracking real active roomId
            }
        });
        console.log(res.data);
    } catch (err) {
        console.error("Error from API:", err.response?.data || err.message);
    }
}

triggerVerification();
