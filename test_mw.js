const fetch = require('node-fetch');

async function testMW() {
    try {
        const mwUrl = "https://makerworld.com/api/v1/search-service/searchlist";
        console.log("Fetching:", mwUrl);
        const res = await fetch(mwUrl);
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response:", text.substring(0, 500));
    } catch(e) {
        console.error(e);
    }
}
testMW();
