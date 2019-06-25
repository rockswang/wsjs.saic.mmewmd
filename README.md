# 中国商标网加密接口
* 解析网页中的&lt;meta id="9DhefwqGPrzGxEp9hPaoag">，生成FSSBBIl1UgzbN7N80T, MmEwMD, y7bRbp, c1K5tw0w6_等加密信息。
* 提供GraphQL API，方便客户端以灵活的顺序调用
* 本仓库仅包括一个简单的命令行例程，用于演示接口调用方法

# 接口地址
  http://39.100.136.50/saic/

# GraphQL Schema定义
```graphql
# 
type Query {
  dummy: Int
}
type Mutation {
  uploadHtml(url: String!, html: String!, initCookieValue: String): String
  fakeEvent(type: Int, keyPressCount: Int, mouseDownCount: Int, sleep: Int): String
  prepareRequest(url: String!, args: SaicArgs): RequestOption
}
type RequestOption {
  url: String!
  method: String
  headers: [String!]
  body: String
}
input SaicArgs {
  nc: Int
  sn: Int
  mn: String
  hnc: String
  page: Int
  tlong: String
}```

# 声明
* 本接口用于研究javascript加解密技术，禁止商用！
* 接口服务器为低配阿里云，无法承受大量并发请求，且作者随时关闭，请勿用于数据采集！
