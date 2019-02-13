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

        console.log('********************************************');

        for (var i = 0; i < left_num; i++) {
            
            try {
                var choice_num = await page.$$eval('.bar .quiz_tit', list => {
                    return list.length;
                });
                await page.waitFor(200);
                console.log('debug: choice_num = ' + choice_num);

                if (choice_num >= 3) {

                    var highest_percent = await page.$$eval('.bar .pct', list => {
                        return list[0].textContent.replace('%', '');
                    });
                    
                    //var highest_percent = await page.$$('.bar .pct')[0].textContent.replace('%', '');
                    console.log('debug: highest_percent = ' + highest_percent);

                    if (Number(highest_percent) > 70) {

                        // 一番目の選択肢の内容
                        var choice_text = await page.$$eval('.bar .quiz_tit', list => {
                            return list[0].textContent;
                        });
                        //var choice_text = await page.$$('.bar .quiz_tit')[0].textContent;
                        console.log(choice_text);

                        if (choice_text.indexOf('正解') != -1 && (choice_text.indexOf('ない') != -1 || choice_text.indexOf('なし') != -1)) {
                            
                            console.log('正解無しのほう');
                            // 2 or 3
                            var num = await Math.floor(Math.random() * 2 + 1) + 1;
                            console.log(num);

                            // 選択肢をクリック
                            await page.evaluate((num)=>document.querySelector('li:nth-child(' + num.toString() + ') .quiz_item').click(), num);

                        } else {
                            console.log('high:1');
                            // 一番目の選択肢をクリック
                            await page.evaluate(()=>document.querySelector('li:nth-child(1) .quiz_item').click());
                        }

                        // OKをクリック
                        await page.evaluate(()=>document.querySelector('button.btn.type1').click());
                        await page.waitFor(1000);

                        done++;
                    } else {
                        // 上から３つランダム(1~3)
                        var num = await Math.floor(Math.random() * 3) + 1;
                        console.log(num);

                        await page.waitFor(200);

                        var choice_text = await page.$$eval('.bar .quiz_tit', list => {
                            return list[num].textContent;
                        });

                        //var choice_text = await page.$$('.bar .quiz_tit')[num].textContent;
                        console.log(choice_text);

                        if (choice_text.indexOf('正解') != -1 && (choice_text.indexOf('ない') != -1 || choice_text.indexOf('なし') != -1)) {
                            
                            console.log('正解無しのほう');
                            num = (num == 3) ? 1 : num+1;
                            console.log(num);

                        }

                        // 選択肢をクリック
                        await page.evaluate((num)=>document.querySelector('li:nth-child(' + num.toString() + ') .quiz_item').click(), num);

                        // OKをクリック
                        await page.evaluate(()=>document.querySelector('button.btn.type1').click());
                        await page.waitFor(1000);

                        done++;
                    }

                }

            } catch (e) {
                console.log('debug: ' + e);
            }

            if (i != left_num - 1) {
                // 次の予想へ
                await page.evaluate(()=>document.querySelector('.btn_quiz_next').click());
                await page.waitFor(1000);
                
                console.log('********************************************');
            }
            
            /* ---予想ロジックの実装--- */
            /*
            var num = await Math.floor(Math.random() * 3) + 1;
            console.log(num);

            try {
                await page.evaluate((num)=>document.querySelector('li:nth-child(' + num.toString() + ') .quiz_item').click(), num);

                // OKをクリック
                await page.evaluate(()=>document.querySelector('button.btn.type1').click());
                await page.waitFor(1000);

                done++;
            } catch (e) {
                console.log("choice is null.");
            }

            if (i != left_num - 1) {
                // 次の予想へ
                await page.evaluate(()=>document.querySelector('.btn_quiz_next').click());
                await page.waitFor(1000); 
            }
            */
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