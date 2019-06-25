const cheerio = require("cheerio")
const rp = require("request-promise")

const debug = true
let fs, tmpDir
if (debug) {
    fs = require("fs")
    tmpDir = "D:/tmp/saic/sj_test"
}

const HOST = "wsjs.saic.gov.cn"
const BASE = "http://" + HOST
const ROWS = 50
// const GPL = "http://localhost:3000/saic"
// const GPL = "http://fxxksaic.free.idcfengye.com/saic"
const GPL = "http://39.100.136.50/saic/"

const jar = rp.jar()
/** 设定默认请求参数 */
const r = rp.defaults({
    proxy: debug ? "http://127.0.0.1:8888" : undefined,     // Fiddler
    rejectUnauthorized: false,          // 配合Fiddler抓包
    resolveWithFullResponse: true,      // 返回完整应答对象
    jar,                                // 保存cookie
    gzip: true,                         // 启用压缩
    timeout: 4000,                      // 超时
    headers: {
        "Host": HOST,
        "Connection": "keep-alive",
        "Cache-Control": "max-age=0",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36",
    }
})

let step = 0

const QRY1 = `mutation ($u: String!, $h: String!, $args: SaicArgs) {
  uploadHtml(url: $u, html: $h)
  f80t: fakeEvent(type: 7, keyPressCount: 10, mouseDownCount: 2, sleep: 100)
  opt: prepareRequest(url: "/txnRead01.do", args: $args) {url, headers, method, body}
}`

const QRY2 = `mutation ($u: String!, $h: String!, $f80t: String, $args: SaicArgs) {
  f80t: uploadHtml(url: $u, html: $h, initCookieValue: $f80t)
  opt: prepareRequest(url: "/txnRead02.ajax", args: $args) {url, headers, method, body}
}`

const QRY3 = `mutation ($args: SaicArgs) {
  opt: prepareRequest(url: "/txnRead02.ajax", args: $args) {url, headers, method, body}
}`
/** 从列表XHR中提取的字段列表 */
const FIELDS = ["index", "tid", "nc", "sn", "mno", "hnc", "fd", "img"]

let argv = {nc: 35, mn: "华为"}
// node sj_test.js --mn=华为 --nc=35
if (process.argv.length > 2) argv = process.argv.splice(2).reduce((o, v) => { const m = /--(hnc|nc|sn|mn)=(.+)/.exec(v); o[m[1]] = m[2]; return o }, {})
argv.nc && (argv.nc = ~~argv.nc)
argv.sn && (argv.sn = ~~argv.sn)

query(argv)

/**
 * @param {QueryArgs} args
 * @return {Promise<{result: number, data: Array}>}
 */
async function query(args) {
    let url = BASE + "/txnT01.do", f80t = undefined
    let method = "GET", headers = undefined, body = undefined
    let page = 1, total, result = []
    main:
    while (1) {
        let resp
        try {
            resp = await r(url, {method, headers, body})
            if (resp.body.length === 0) throw new Error()
        } catch (err) { // 清除cookie, 重新开始
            await new Promise(done => setTimeout(done, 200))
            ;[url, f80t] = [BASE + "/txnT01.do"]
            jar._jar.store.removeCookie(HOST, "/", "FSSBBIl1UgzbN7N80S", () => {})
            continue
        }
        if (debug) fs.writeFileSync(`${tmpDir}/${step}.html`, resp.body)
        const path = /(\/\w+\.(?:do|ajax))/.exec(url)[1]
        const token = jar.getCookies(BASE).find(c => c.key === "FSSBBIl1UgzbN7N80S").value
        let label, query, variables
        switch (path) {
        case "/txnT01.do":
            [label, query, variables] = ["入口页", QRY1, {u: url, h: resp.body, args: {...args}}]
            break
        case "/txnRead01.do":
            [label, query, variables] = ["列表页", QRY2, {u: url, h: resp.body, f80t, args: {...args, page}}]
            break
        case "/txnRead02.ajax":
            const $ = cheerio.load(resp.body, {xmlMode: true})
            // <record>
            // <index>53</index>
            // <tid>TID2018085375DBE20B1C06977F56818975AA4E35F2F40</tid>
            // <tmid>3267353740</tmid>
            // <nc>40</nc>
            // <rn>32673537</rn>
            // <sn>32673537</sn>
            // <mno>酷玩心选</mno>
            // <hnc>广州酷玩科技有限公司</hnc>
            // <fd>2018年08月03日</fd>
            // <img>http://wswj.saic.gov.cn:8080/images/TID/201808/537/5DBE20B1C06977F56818975AA4E35F2F/40/ORI.JPG</img>
            // </record>
            const records = $("record").get().map(n => FIELDS.reduce((o, v) => (o[v] = $(n).find(v).text(), o), {}))
            if (resp.body.length === 0 || records.length === 0) throw new Error("查询失败: records")
            Array.prototype.push.apply(result, records)
            if (total === undefined) {
                const number = parseInt($("attribute-node>record_record-number").text())
                if (!number) throw new Error("查询失败: number")
                total = parseInt((number - 1) / ROWS) + 1
                console.log(`number=${number}`)
            }
            if (page >= total) break main
            page++
            const tlong = $("request>tlong").text()
            ;[label, query, variables] = ["列表XHR", QRY3, {args: {...args, page, tlong}}]
            break
        }
        console.log(`${label}: length=${resp.body.length}`)

        resp = await r.post(GPL, {json: true, headers: {token}, body: {query, variables}})
        ;({f80t, opt: {url, method = "GET", headers, body}} = resp.body.data)
        f80t && jar.setCookie(`FSSBBIl1UgzbN7N80T=${f80t}`, BASE)
        headers && (headers = headers.reduce((o, v, i, a) => (i % 2 && (o[a[i - 1]] = v), o), {}))
        step++
    }
    result.map(JSON.stringify).forEach(s => console.log(s))

    return {result: 200, data: result}
}

/**
 * @typedef {Object} QueryArgs
 * @property {number} [nc] - 国际分类，数字
 * @property {number} [sn] - 申请/注册号，数字
 * @property {number} [mn] - 商标名称关键字
 * @property {number} [hnc] - 申请人名称中文关键字
 */

