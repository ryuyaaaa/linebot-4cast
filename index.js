const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

const address = "";
const password = "";

(async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.emulate(devices['iPhone X']);
  
    await page.goto('https://www.4cast.to', {waitUntil: "domcontentloaded"});
    await page.setViewport({ width: 1200, height: 800 });

    // 5個目までスワイプ
    await page.evaluate(()=>document.querySelector('div.swiper-pagination span:nth-child(5)').click());
    //await page.click('div.swiper-pagination span:nth-child(5)');

    // 「はじめる」ボタンクリック
    await page.evaluate(()=>document.querySelector('div.btn_close button').click());
    //await page.click('div.btn_close button');
    
    // ナビゲーションバー -> プロフィール
    await page.evaluate(()=>document.querySelector('ul li a.btn_my').click());
    //await page.click('ul li a.btn_my');

    // LINEログインボタン
    await page.evaluate(()=>document.querySelector('.login_btn ul li.on button').click());
    //await page.click('.login_btn ul li.on button');

    await page.waitForNavigation({timeout: 60000, waitUntil: "domcontentloaded"});

    // LINE情報入力
    //await page.evaluate(()=>document.querySelector('.MdInputTxt01 .mdInputTxt01Label+input[type="text"]').type(address));
    //await page.evaluate(()=>document.querySelector('.MdInputTxt01 .mdInputTxt01Label+input[type="password"]').type(password));
    await page.type('.MdInputTxt01 .mdInputTxt01Label+input[type="text"]', address);
    await page.type('.MdInputTxt01 .mdInputTxt01Label+input[type="password"]', password);

    // LINEでログインする
    await page.evaluate(()=>document.querySelector('.mdFormGroup01Btn button[type="submit"]').click());
    //await page.click('.mdFormGroup01Btn button[type="submit"]');

    await page.waitFor(3000);

    // 未参加をクリック
    var left_num = await page.$eval('.my_report li:nth-child(3) .num', item => {
        return Number(item.textContent.trim());
    });

    console.log(left_num);

    //await page.evaluate(()=>document.querySelector('.my_report li:nth-child(3) .num').click());
    await page.click('.my_report li:nth-child(3) .num');

    await page.waitFor(3000);

    if (left_num != 0) {

        // 一番上のトピックをクリック
        await page.evaluate(()=>document.querySelector('ul li').click());
        //await page.click('ul li');

        await page.waitFor(3000);

        // 注意書き的なやつタップ
        //await page.evaluate(()=>document.querySelector('.quiz_gest_wrap').tap());
        await page.tap('.quiz_gest_wrap');

        for (var i = 0; i < left_num; i++) {
            
            /* ---予想ロジックの実装--- */
            var choice_num = choice_num = await Math.floor(Math.random() * 3);
            console.log(choice_num);

            await page.waitFor(1000);            

            // 選択肢をクリック
            await page.evaluate((choice_num)=>document.querySelector('ul li:nth-child(' + (choice_num+1).toString() + ') a.bar div.quiz_item').click(), choice_num);
            //await page.click('ul li:nth-child(' + (random+1).toString() + ') a.bar div.quiz_item');

            // OKをクリック
            await page.evaluate(()=>document.querySelector('button.btn.type1').click());
            await page.waitFor(1000);  

            if (i != left_num - 1) {
                // 次の予想へ
                await page.evaluate(()=>document.querySelector('a.btn_quiz_next.fadeOut').click());
                await page.waitFor(1000); 
            }
        }
    }
    
    await browser.close();
})();