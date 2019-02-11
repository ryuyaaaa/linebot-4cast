const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const request = require('request');
const crypt = require('./util/crypt');

const address = crypt.decrypt(process.env.MAIL_ADDRESS);
const password = crypt.decrypt(process.env.PASSWORD);
const channelAccessToken = process.env.CHANNEL_ACCESS_TOKEN;
const lineUserId = process.env.LINE_USER_ID;

(async () => {

    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
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
    var left_num = await page.$eval('.left .num', item => {
        return Number(item.textContent.trim().replace(/,/g, ''));
    });
    console.log(left_num);

    var done = 0;
    
    await page.evaluate(()=>document.querySelector('.left .num').click());
    //await page.click('.left .num');

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
            var num = await Math.floor(Math.random() * 3) + 1;
            console.log(num);

            await page.waitFor(1000);

            try {
                await page.evaluate((num)=>document.querySelector('li:nth-child(' + num.toString() + ') .quiz_item').click(), num);

                // OKをクリック
                await page.evaluate(()=>document.querySelector('button.btn.type1').click());
                await page.waitFor(1000);

                done++;
            } catch (e) {
                console.log("choice is null.");
            }
            // if (page.$('li:nth-child(' + num.toString() + ') .quiz_item') != null) {
            //     await page.evaluate((num)=>document.querySelector('li:nth-child(' + num.toString() + ') .quiz_item').click(), num);

            //     // OKをクリック
            //     await page.evaluate(()=>document.querySelector('button.btn.type1').click());
            //     await page.waitFor(1000);

            //     done++;
            // }

            if (i != left_num - 1) {
                // 次の予想へ
                await page.evaluate(()=>document.querySelector('.btn_quiz_next').click());
                await page.waitFor(1000); 
            }
        }
    }

    var options = {
        url: 'https://api.line.me/v2/bot/message/push',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': "Bearer " + channelAccessToken
        },
        json: true,
        body: {
            'to': lineUserId,
            'messages': [
                {
                    'type': 'text',
                    'text': done + '個予想しといたで'
                }           
            ]
        }
    };

    // LINE APIにPOST
    request.post(options, function(error, response, body) {
        console.log(response.statusCode);
    });
    
    await browser.close();
})();