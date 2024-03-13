/**
 * The fetch data function is slow and we need
 * reduce the calls to the network and make
 */

import redis from "ioredis";
import { REDIS_URL } from "../config";

const client = new redis(REDIS_URL);

(async function () {
  await client.flushall();
})();

async function fetchData() {
  const response = await fetch("https://pokeapi.co/api/v2/pokemon/");
  const data = await response.json();

  return data;
}

async function fetchWithCache(fetchFn: typeof fetchData, key: string) {
  const cachedData = await client.get(key);
  if (cachedData) {
    return cachedData;
  }
  const data = fetchData();
  await client.set(key, JSON.stringify(cachedData));
  return data;
}

async function main() {
  console.time("fetchData");
  await fetchWithCache(fetchData, "pokemon");
  console.timeEnd("fetchData");
  console.time("fetchData again");
  await fetchWithCache(fetchData, "pokemon");
  console.timeEnd("fetchData again");
  console.time("fetchData again");
  await fetchWithCache(fetchData, "pokemon");
  console.timeEnd("fetchData again");
}

main();
