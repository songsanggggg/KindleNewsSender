const { JSDOM } = require('jsdom');
const nodemailer = require('nodemailer');
const epub = require('epub-gen')
const path = require('path')

const sender = ''; //邮箱账号
const pass = ''; //授权码
const receiver = ''; //收件人

//SMTP客户端配置
const transporter = nodemailer.createTransport({
    // 默认支持的邮箱服务包括：”QQ”、”163”、”126”、”iCloud”、”Hotmail”、”Yahoo”等
    service: "163",
    auth: {
        user: sender,
        pass: pass
    }
})

//发送邮件
async function sendMail() {
    await getNewsContent()
     let _receiver = {
        from: `"每日新闻联播"<${sender}>`,
        subject: "新闻联播",
        to: receiver,
        attachments: [
            {
                filename: 'News.epub',
                path: './News.epub'
            }
        ]
    }

    transporter.sendMail(_receiver, (error, info) => {
        if (error) {
            return console.log('发送失败:', error);
        }
        transporter.close()
        console.log('发送成功:', info.response)
    })
}

//获取年月日
function getDate() {
     let currentDate = new Date();
     let year = currentDate.getFullYear();
     let month = String(currentDate.getMonth() + 1).padStart(2, '0');
     let day = String(currentDate.getDate()).padStart(2, '0');

    return { year, month, day };
}
function getPreviousDate(year, month, day) {
     let currentDate = new Date(year, month - 1, day);
     let previousDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);

     let previousYear = previousDate.getFullYear();
     let previousMonth = (previousDate.getMonth() + 1).toString().padStart(2, '0');
     let previousDay = previousDate.getDate().toString().padStart(2, '0');

    return { previousYear, previousMonth, previousDay };
}

async function getNewsContent() {
    //获取内容
     let { year, month, day } = getDate();
    let url = encodeURI(`http://mrxwlb.com/${year}/${month}/${day}/${year}年${month}月${day}日新闻联播文字版`)
    let res = await fetch(url);
    res = await res.text();
    if (res.includes('Ooops.. 404.')) {
         let { previousYear, previousMonth, previousDay } = getPreviousDate(year, month, day);
        url = encodeURI(`http://mrxwlb.com/${previousYear}/${previousMonth}/${previousDay}/${previousYear}年${previousMonth}月${previousDay}日新闻联播文字版`)
        res = await fetch(url);
        res = await res.text();
    }
    else {
        return true;
    }

    //处理内容
    let dom = new JSDOM(res, { includeNodeLocations: true });
    let doc = dom.window.document;
    let section = doc.querySelector('section.entry-content');
    let content = section.innerHTML.split('\n<p><strong>');
    let chapter = [];
    for(num in content){
        if(num >= 1 && content[num] != '国内联播快讯</strong></p>\n<p></p>'
        ){
            let lineArr = content[num].split('\n')
            let data;
            for(num in lineArr){
                if(num >= 1){
                    data = data + lineArr[num] + '\n';
                }
            }
            let  chatper_O = {
                title: lineArr[0].replace('</strong></p>' , ''),
                data: data.replace('undefined' , ''),
            };
            chapter.push(chatper_O);
        }
    }

    // 将内容写入文件
    const epubOption = {
        title: `${year}/${month}/${day}/${year}年${month}月${day}日新闻联播文字版`,
        author: 'songsanggggg',
        publisher: 'songsanggggg',
        cover: 'https://s11.ax1x.com/2023/12/31/piX9LKs.jpg',
        content: chapter
    };

    try {
        await new epub(epubOption, 'News.epub').promise;
        console.log('EPUB generated successfully');
    } catch (error) {
        console.error('Failed to generate EPUB:', error);
    }
}

sendMail().catch(error => {
    console.error('发送邮件出错:', error);
});
