import { Paydisini } from '@ibnusyawall/paydisini';

const client = new Paydisini("5973dddbd48bfcd3ee51bff575b85182");

// Define your transaction options
const options = {
    unique_code: "UNIQUE12345", // replace with your unique code optional, in minutes
};

(async () => {
    try {
        const cancelTansaction = await client.cancelTransaction(options)
        console.log(cancelTansaction);
    } catch (error) {
        console.error("Error creating transaction:", error);
    }
})();
