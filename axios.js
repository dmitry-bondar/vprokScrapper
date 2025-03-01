const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');

// Основная функция
(async () => {
    const categoryUrl = process.argv[2];
    if (!categoryUrl) {
        console.error('Пожалуйста, укажите ссылку на категорию товаров.');
        process.exit(1);
    }

    const products = await fetchProductData(categoryUrl);
    if (products.length > 0) {
        saveProductsToFile(products);
        console.log('Данные о товарах успешно сохранены в файл products-api.txt');
    } else {
        console.log('Не удалось получить данные о товарах.');
    }
})();

// Функция для извлечения данных о товарах
async function fetchProductData(url) {
    try {
        // Делаем запрос к странице категории
        const result = await axios.get(url, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Pragma': 'no-cache',
                'Referer': 'https://www.google.com/',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
            },
        }).then(async (response) => {
            if (response && response.status === 200) {
                // console.log(response.data)
                return (response.data);
            } else {
                console.log(response && response?.statusCode ? response.statusCode : '');
            }
        }).catch(async (e) => {
            console.log(`get promise error: ${e}`);
        });
        const $ = cheerio.load(result);
        const data = JSON.parse($('#__NEXT_DATA__').html())
        let productsData = data?.props?.pageProps?.initialStore?.catalogPage?.products
        productsData = !productsData || (productsData && !productsData.length) ? data?.props?.pageProps?.initialStore?.listing?.products : productsData

        // Массив для хранения данных о товарах
        const products = [];

        // Извлекаем данные о каждом товаре
        (productsData || []).forEach((item) => {
            products.push({
                title: item.quantum ? `${item.name} ${item.fraction} ${item.fractionText}` : item.name,
                imageUrl: JSON.stringify(item.images?.map((item) => item.url.replace('<SIZE>', 'x500'))) || '',
                rating: item.rating || '',
                reviews: item.reviews || '',
                price: item.price ? Math.floor(item.price * 100) / 100 : '',
                oldPrice: item.oldPrice ? Math.floor(item.oldPrice * 100) / 100 : '',
                promoPrice: item.quantityDiscount?.[0]?.price || '',
                discount: item.discountPercent || '',
            });
        });
        return products;
    } catch (error) {
        console.error('Ошибка при получении данных о товарах:', error);
        return [];
    }
}

// Функция для записи данных в файл
function saveProductsToFile(products) {
    const fileStream = fs.createWriteStream('products-api.txt');
    products.forEach(product => {
        fileStream.write(`Название товара: ${product.title}\n`);
        fileStream.write(`Ссылка на изображение: ${product.imageUrl}\n`);
        fileStream.write(`Рейтинг: ${product.rating}\n`);
        fileStream.write(`Количество отзывов: ${product.reviews}\n`);
        fileStream.write(`Цена: ${product.price}\n`);
        fileStream.write(`Цена до акции: ${product.oldPrice}\n`);
        fileStream.write(`Акционная цена: ${product.promoPrice}\n`);
        fileStream.write(`Размер скидки: ${product.discount}\n`);
        fileStream.write('\n');
    });
    fileStream.end();
}
