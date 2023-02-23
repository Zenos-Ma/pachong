//

const express = require("express");
// 创建web服务器
const app = express();
// const request = require("request");
const https = require("https"); //看网址的http是加s还是不加s
const cheerio = require("cheerio");
const fs = require("fs");
const xlsx = require("node-xlsx");

// https.get("https://movie.douban.com/top250?start=100&filter=", (res) => {
//   // console.log("res", res);
//   // 分段返回的，自己拼接
//   var html = "";
//   res.on("data", (chunk) => {
//     html += chunk;
//   });
//   res.on("end", () => {
//     // console.log("html", html);
//     const $ = cheerio.load(html);
//     let allFilms = [];
//     $("li .item").each(function () {
//       // this 循环时，指向当前这个电影
//       // 当前这个电影下面的title
//       // 相当于this.querySelector

//       const title = $(".title", this).text();
//       const star = $(".rating_num", this).text();
//       const pic = $(".pic a img", this).attr("src");
//       // const person = $(".bd>p", this).text();
//       // 存数据库
//       allFilms.push({
//         title,
//         star,
//         pic,
//         // person,
//       });
//     });
//     // console.log("allFilms", allFilms);
//     fs.writeFile("./films.json", JSON.stringify(allFilms), function (err) {
//       if (!err) {
//         // console.log("文件写入完毕！");
//       }
//     });
//     downLoadImage(allFilms);
//     const title = ["电影名称", "评分", "封面", "人物"];
//     let arrList = [];
//     for (let i = 0, len = allFilms.length; i < len; i++) {
//       let item = allFilms[i];

//       arrList.push([[item.title], [item.star], [item.pic]]);
//     }
//     console.log("arrList", arrList);
//     let arrListStr = [];
//     let arrObj = {};
//     arrObj = {
//       name: "電影",
//       data: arrList,
//     };
//     arrListStr.push(arrObj);
//     // let buf = xlsx.build([{ name: "abc" }, { data: arrList }]);
//     console.log("arrListStr", arrListStr);
//     fs.writeFile("my.xlsx", xlsx.build(arrListStr), "binary", (err) => {
//       if (!err) {
//         console.log("导出成功");
//       }
//     });
//   });
// });

function downLoadImage(allFilms) {
  for (let i = 0, len = allFilms.length; i < len; i++) {
    let picUrl = allFilms[i].pic;
    // 请求拿到图片的地址
    https.get(picUrl, function (res) {
      res.setEncoding("binary");
      let str = "";
      res.on("data", function (chunk) {
        str += chunk;
      });
      res.on("end", function () {
        // fs.writeFile('./xx.png','内容')
        fs.writeFile(`./images/${i}.png`, str, "binary", function (err) {
          if (!err) {
            // console.log(`第${i}张图片下载成功`);
          }
        });
      });
    });
  }
}

//
let httpUrl = "https://www.1905.com/vod/list/n_1_t_1/o3p1.html";
let axios = require("axios");
function req(link) {
  return new Promise((resolve, reject) => {
    axios
      .get(link)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
// 获取起始页面的所有分类地址
const path = require("path");
// 目标：下载音乐
// 1.获取音乐相关的信息，通过信息获取下载地址
// 2.通过获取音乐列表获取音乐信息
// 3.通过音乐的分类页获取音乐列表
async function getPage(num) {
  let httpUrl = "http://www.app-echo.com/api/recommend/sound-day?page=" + num;
  let res = await axios.get(httpUrl);
  // console.log(res.data.list);
  let list = res.data.list;
  list.forEach(function (item, i) {
    let title = item.sound.name;
    let musicUrl = item.sound.source;
    let fileName = path.parse(musicUrl).name;
    let content = `${title},${musicUrl}.${fileName}\n`;
    fs.writeFile("music.txt", content, { flag: "a" }, function () {
      // console.log('写入完成:'+ title);
    });
    // console.log(path.parse(musicUrl));
    download(musicUrl, fileName);
  });
}
async function download(link, fileName) {
  let res = await axios.get(link, { responseType: "stream" });
  let ws = fs.createWriteStream("./music/" + fileName + ".mp3");
  console.log(res.data);
  res.data.pipe(ws);
  res.data.on("close", function () {
    ws.close();
  });
}
// 爬一页意思一下就行了
// getPage(1);

// 爬取表情包
const url = require("url");
// 将延迟函数封装成promise对象，防止请求速度过快导致下载失败
function awit(second) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("成功执行延迟函数:" + second);
    }, second);
  });
}

// 获取表情包的html文档内容
async function pageNum(link) {
  let res = await axios.get(link);
  let $ = cheerio.load(res.data);
  let bthLength = $(".pagination li").length;
  let allNum = $(".pagination li")
    .eq(bthLength - 2)
    .find("a")
    .text();
  return allNum;
}
// 获取界面
async function getListPage(pageNum) {
  let httpUrl = `https://www.doutula.com/article/list/?page=${pageNum}`;
  let res = await axios.get(httpUrl);
  let $ = cheerio.load(res.data);
  $("#home .col-sm-9>a").each((i, v) => {
    let pageUrl = $(v).attr("href");
    console.log("pageUrl", pageUrl);
    let title = $(v).find(".random_title").text();
    let reg = /(.*?)\d/gis;
    title = reg.exec(title)[1];
    fs.mkdir("./img/" + title, function (err) {
      if (err) {
        console.log("err", err);
      } else {
        console.log("创建：" + "./img/" + title);
      }
    });
    parsePage(pageUrl, title);
  });
}

// 进入表情包详情
async function parsePage(link, title) {
  let res = await axios.get(link);
  let $ = cheerio.load(res.data);
  $(".pic-content img").each((i, v) => {
    let imgUrl = $(v).attr("src");
    let b = url.parse(imgUrl);
    let name = path.parse(b.pathname);
    // 创建路径名称
    let filePath = `./img/${title}/${name.base}`;
    // 创建写入流
    let ws = fs.createWriteStream(filePath.trim());
    axios.get(imgUrl, { responseType: "stream" }).then(function (res) {
      res.data.pipe(ws);
      console.log("正在下载表情：" + filePath);
      // 监听事件，关闭写入流
      res.data.on("close", () => ws.close());
    });
  });
}

// 开始爬取所有的界面的表情包
async function spider(link) {
  let allPageNum = await pageNum(link);
  for (let i = 1; i < 10; i++) {
    await awit(4000);
    getListPage1(i);
  }
}

// spider("https://www.doutula.com/article/list/?page=1");

// 爬取最新的微信表情包
async function getListPage1(pageNum) {
  let httpUrl = `https://www.pkdoutu.com/photo/list/?page=${pageNum}`;
  let res = await axios.get(httpUrl);
  // console.log("res", res);
  let $ = cheerio.load(res.data);
  $("#pic-detail .col-sm-9 a").each((i, v) => {
    let pageUrl = $(v).attr("href");
    console.log("pageUrl", pageUrl);
    let title = $(v).find("p").text();
    fs.mkdir("./newimg/" + title, function (err) {
      if (err) {
        console.log("err", err);
      } else {
        console.log("创建：" + "./img/" + title);
      }
    });
    parsePage1(pageUrl, title);
  });
}

async function parsePage1(link, title) {
  let res = await axios.get(link);
  let $ = cheerio.load(res.data);
  $(".swiper-slide img").each((i, v) => {
    let imgUrl = $(v).attr("src");
    let b = url.parse(imgUrl);
    let name = path.parse(b.pathname);
    // 创建路径名称
    let filePath = `./newimg/${title}/${name.base}`;
    // 创建写入流
    let ws = fs.createWriteStream(filePath.trim());
    axios.get(imgUrl, { responseType: "stream" }).then(function (res) {
      res.data.pipe(ws);
      console.log("正在下载表情：" + filePath);
      // 监听事件，关闭写入流
      res.data.on("close", () => ws.close());
    });
  });
}

spider("https://www.pkdoutu.com/photo/list/?page=1");
app.listen(9999, () => {
  console.log("服务器已启动!!!");
});
