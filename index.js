const { JSDOM } = require('jsdom');
const nodemailer = require('nodemailer');
var fs = require("fs");

//SMTP客户端配置
const transporter = nodemailer.createTransport({
    // 默认支持的邮箱服务包括：”QQ”、”163”、”126”、”iCloud”、”Hotmail”、”Yahoo”等
    service: "QQ",
    auth: {
        //邮箱账号
        user: '',
        //授权码
        pass: ''
    }
})

//发送邮件
async function sendMail() {
    await getNewsContent()
    const receiver = {
        //发件人'昵称<发件人邮箱>'
        from: `"每日新闻联播"<>`,
        subject: "新闻联播",
        //收件人
        to: '',
        html:'123',
        attachments: [
            {
                filename: 'news.txt',
                path: './News.txt'
            }
        ]
    }

    transporter.sendMail(receiver, (error, info) => {
        if (error) {
            return console.log('发送失败:', error);
        }
        transporter.close()
        console.log('发送成功:', info.response)
    })
}

//获取年月日
function getDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');

    return { year, month, day };
}
function getPreviousDate(year, month, day) {
    const currentDate = new Date(year, month - 1, day);
    const previousDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);

    const previousYear = previousDate.getFullYear();
    const previousMonth = (previousDate.getMonth() + 1).toString().padStart(2, '0');
    const previousDay = previousDate.getDate().toString().padStart(2, '0');

    return { previousYear, previousMonth, previousDay };
}

async function getNewsContent() {
    //获取内容
    const { year, month, day } = getDate();
    let url = encodeURI(`http://mrxwlb.com/${year}/${month}/${day}/${year}年${month}月${day}日新闻联播文字版`)
    let res = await fetch(url);
    res = await res.text();
    if (res.includes('Ooops.. 404.')) {
        const { previousYear, previousMonth, previousDay } = getPreviousDate(year, month, day);
        url = encodeURI(`http://mrxwlb.com/${previousYear}/${previousMonth}/${previousDay}/${previousYear}年${previousMonth}月${previousDay}日新闻联播文字版`)
        res = await fetch(url);
        res = await res.text();
    }
    else {
        return true;
    }

    //处理内容
    const dom = new JSDOM(res, { includeNodeLocations: true });
    const doc = dom.window.document;
    const section = doc.querySelector('section.entry-content');
    const content = section.innerHTML.replace(/<\/?[^>]+(>|$)/g, '').replace(/<\/?[^>]+(>|$)/g, '');

    // 将内容写入文件
    fs.writeFile('News.txt', content, (err) => {
        if (err) {
            console.error('写入文件出错:', err);
        } else {
            console.log('内容已保存至 News.txt');
        }
    });
}

sendMail().catch(error => {
    console.error('发送邮件出错:', error);
});