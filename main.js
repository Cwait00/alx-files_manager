const redisClient = require('./utils/redis');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});

(async () => {
  try {
    // Wait for a short period to ensure the connection is established
    await sleep(100); 

    console.log(redisClient.isAlive()); // should print true if connected

    console.log(await redisClient.get('myKey')); // should print null initially

    await redisClient.set('myKey', 12, 5); // set key with 5 seconds expiration

    console.log(await redisClient.get('myKey')); // should print 12

    setTimeout(async () => {
      console.log(await redisClient.get('myKey')); // should print null after 10 seconds
    }, 1000 * 10);
  } catch (error) {
    console.error('Error:', error);
  }
})();
