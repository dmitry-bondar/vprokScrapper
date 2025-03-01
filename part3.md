1. Рандомный выбор прокси из массива при каждом запросе

````
function getProxy() {
    const proxies = ['http://192.168.1.1:8080', 'http://192.168.1.1:8081', 'http://192.168.1.1:8082'];    
    const randomIndex = Math.floor(Math.random() * proxies.length);
    return proxies[randomIndex];
}
const proxy = getProxy();
const response = await axios.get(url, {httpsAgent:new httpsProxyAgent(proxy)});
````

2.Выбор качественных прокси из массива .
В данном случае каждый ip имеет статус качества. В случае ошибочного ответа на запрос, он помечается и в следущий раз уже не будет выдаваться.
Плохой ip помечается на определенное время, спустя которое снова может быть выдан.
````
const proxies = [
  { url: 'http://192.168.1.1:8080', errors: 0, lastErrorTimestamp: null },
  { url: 'http://192.168.1.1:8081', errors: 0, lastErrorTimestamp: null },
  { url: 'http://192.168.1.1:8082', errors: 0, lastErrorTimestamp: null },
];

function getProxy() {
  const now = Date.now();
  const availableProxies = proxies.filter(proxy => proxy.lastErrorTimestamp === null || (now - proxy.lastErrorTimestamp) > 3600000); // время бана - час

  if (availableProxies.length === 0) {
    throw new Error('Нет доступных прокси');
  }
  
  return availableProxies.reduce((prev, curr) => 
    curr.errors < prev.errors ? curr : prev
  );
}

async function fetchWithBestProxy(url) {
  const proxy = getProxy();
  try {
    const response = await axios.get(url, {httpsAgent:new httpsProxyAgent(proxy)});
    return response.data;
  } catch (e) {
    proxy.errors += 1; // Увеличиваем счетчик ошибок
    return null;
  }
}

await fetchWithBestProxy(url);
````