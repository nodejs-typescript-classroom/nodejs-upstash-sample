/**
 * the doSomeWork function is expensive to run and must protect from abuse
 * throw an error if the function is called more than 5 times in a 5 second window
 */

import redis from "ioredis";
import { REDIS_URL } from "../config";

const client = new redis(REDIS_URL);

(async function () {
  await client.flushall();
})();
async function rateLimiter(
  userId: string,
  maxRequests: number,
  windowSizeInSeconds: number
) {
  const key = `rate-limiter:${userId}`;

  const current = await client
    .multi()
    .incr(key)
    .expire(key, windowSizeInSeconds)
    .exec();
  if (!current || current.length === 0) {
    return false;
  }

  for (let i = 0; i < current.length; i++) {
    if (current[i][0]) {
      console.error("redis error", current[i][0]);
      return false;
    }
  }
  const requestCount = current[0][1] as number;
  if (requestCount > maxRequests) {
    return false;
  }
  return true;
}

async function doSomeWork() {
  // use a constant string to limit all request with single ratelimit
  // Or use a userID, apiKey or ip address for individual limits
  const success = await rateLimiter("some-user", 5, 5);
  if (!success) {
    throw new Error("rate limit exceed");
  }
  return "success";
}

for (let i = 0; i < 10; i++) {
  doSomeWork()
    .then(() => console.log(`Request ${i} succeeded`))
    .catch((err) => {
      console.log(`Request ${i} failed with error: ${err.message}`);
    });
}
