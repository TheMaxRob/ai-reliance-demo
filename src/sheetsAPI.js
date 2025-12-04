async function sendResultsToGoogleSheet() {
    const url = "https://script.google.com/macros/s/AKfycbwD4AD8pCq55wVR5cmTbHOe8UBm8LIOJuVSVEYGGvlrqTvr54YFbNmeqtBnqKbIrgk/exec";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                participantID,
                reuslts
            }),
        });
        alert("Experiment complete! Your results were submitted."); 
    } catch (error) {
        console.error("Error sending results to Google Sheets:", error);
        alert("Experiment complete, but there was an error submitting your results.");
    }
}