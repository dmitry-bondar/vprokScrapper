const puppeteer = require('puppeteer-extra');
const fs = require('fs');

(async () => {
    if (process.argv.length < 4) {
        console.log('Ошибка запуска, не  хватает аргумента: node puppeteer.js <URL> <Region>');
        process.exit(1);
    }

    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--start-maximized',
            // '--window-size=1800,700'
        ],
        // headless: false,
        timeout: 60000,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        defaultViewport: null
    });
    const page = await browser.newPage();

    const url = process.argv[2];
    const region = process.argv[3];

    try {
        // Выбор региона
            await setCookies(page, region)
        //переход на страницу и ожидание подгрузки селекторов
        await page.goto(url, {waitUntil: 'domcontentloaded'});
        await page.waitForSelector(selectorCard, {visible: true, timeout: 15000}).catch((e) => console.log(e));
        //делаем скриншот

        await page.screenshot({path: 'screenshots/screenshot.jpg'});

        // Извлекаем данные о товаре
        const productData = await page.evaluate((selector) => {
            const el = document.querySelector(selector)
            const priceBlock = el.querySelector('[class*=ProductPage_informationBlock]')
            const reviewBlock = el.querySelector('[class*=ActionsRow_reviewsWrapper]')
            return {
                price: priceBlock.querySelector('[class*=Price_role_regular], [class*=Price_role_discount]')?.textContent?.trim()?.replace(/[^\d.,]/g, '') || '',
                oldPrice: priceBlock.querySelector('[class*=Price_role_old]')?.textContent?.trim()?.replace(/[^\d.,]/g,'') || '',
                rating: reviewBlock.querySelector('[class*=ActionsRow_stars]')?.textContent?.trim() || '',
                reviews: reviewBlock.querySelector('[class*=ActionsRow_reviews_]')?.textContent?.trim()?.replace(/\D+/g,'') || '',
            };
        }, selectorCard);

        console.log(JSON.stringify(productData))

        // Сохраняем в файл
        const output = `Цена: ${productData.price}\nСтарая цена: ${productData.oldPrice}\nРейтинг: ${productData.rating}\nКоличество отзывов: ${productData.reviews}\n`;
        fs.writeFileSync('product.txt', output, 'utf8');

        console.log('Данные сохранены, скриншот сделан!');
    } catch (error) {
        console.error('Ошибка:', error);
    } finally {
        await browser.close();
    }

})();
const regions = {
    "Москва": {
        "cookies": {
            "region": "1",
            "shop": "2527",
            "standardShopId": "2527",
            "isUserAgreeCookiesPolicy": "true"
        }
    },
    "Санкт-Петербург и область": {
        "cookies": {
            "region": "2",
            "shop": "2246",
            "standardShopId": "2246",
            "isUserAgreeCookiesPolicy": "true"
        }
    },
};
const selectorCard = '[itemtype="https://schema.org/Product"]';
async function setCookies(page, region) {
    try {
        const cookies = regions[region]?.cookies
        for (let name in cookies) {
            const cookie = typeof (cookies[name]) === 'object' ? cookies[name] : {
                'name': name,
                'value': cookies[name],
                'expires': Math.ceil(Date.now() / 1000 + 6000),
                'domain': '.vprok.ru'
            };
            await page.setCookie(cookie);
        }
        console.log(`Установили куки для ${region}`)
    } catch (err) {
        console.log('Error: {}', err);
    }
    return true
}