# 中国商标网加密接口
* 解析网页中的`&lt;meta id="9DhefwqGPrzGxEp9hPaoag">`，生成`FSSBBIl1UgzbN7N80T`, `MmEwMD`, `y7bRbp`, `c1K5tw0w6_`等加密信息。
* 提供GraphQL API，方便客户端以灵活的顺序调用
* 本接口并不直接访问中国商标网，而是仅用于为客户端生成加密后请求参数
* 本仓库仅包括一个简单的命令行例程，用于演示接口调用方法

# 接口地址
  http://39.100.136.50/saic/
  注意：
  * 仅支持POST，请求体为application/json格式
  * 需要添加token请求头，内容为首次请求首页获得的FSSBBIl1UgzbN7N80S cookie值

# 关于DEMO
* 调用方法
  `node gql_demo.js --nc=34 --mn=鸿蒙 --nc=9`

# 工作流程
1. 客户端不带任何cookie请求中国商标网首页，目的是获取F80S cookie值
1. 客户端以首页内容和查询参数请求本接口，获取到/txnRead01.do（列表页）的加密后完整请求参数
1. 使用获取到的请求参数请求列表页
1. 以列表页内容和查询参数请求本接口，获取到/txnReade02.ajax（列表页xml数据）的加密后完整请求参数
1. 使用获取到的请求参数请求列表XHR接口，提取数据，并在第一页中获取总记录数，计算页数
1. 不断重复上面两步，直到所有页面请求完毕

# GraphQL Schema定义
```graphql
# 根查询
type Query {
  # 占位字段，因为graphql必须包含至少一个根查询字段
  dummy: Int
}
# 根变更，使用Mutation而不用Query因为以下调用必须依次执行
type Mutation {
  # 客户端请求完文档后，使用此调用上传html内容；返回初次运行生成的F80T cookie值
  # url - 页面地址。仅用来区分页面地址，此脚本并不发起请求
  uploadHtml(url: String!, html: String!, initCookieValue: String): String
  # 模拟一次导致cookie更新的浏览器事件，返回更新后的cookie值；
  # type - 导致cookie最后一次更新的动作类型：3 - 点击（默认值）, 7 - 表单提交
  # keyPressCount - 按键计数，对于提交事件，需要按照实际情况提供
  # mouseDownCount - 鼠标点击计数，对于点击事件，默认值为大于1的随机整数
  # sleep - 延迟给定毫秒数之后再模拟事件
  fakeEvent(type: Int, keyPressCount: Int, mouseDownCount: Int, sleep: Int): String
  # 根据给定的url或uri，以及查询参数，生成完整请求信息
  prepareRequest(url: String!, args: SaicArgs): RequestOption
}
# 返回类型，客户端向商标网发起请求的参数
type RequestOption {
  url: String!
  method: String
  headers: [String!]
  body: String
}
# 商标网查询参数
input SaicArgs {
  # 国际分类，数字
  nc: Int
  # 申请/注册号，数字
  sn: Int
  # 商标名称关键字
  mn: String
  # 申请人名称中文关键字
  hnc: String
  # 页码，适用于/txnRead02.ajax
  page: Int
  # 从/txnRead02.ajax返回的xml中提取，第一页不需要
  tlong: String
}
```

# 声明
* 暂时不支持详情页
* 本接口仅可用于研究javascript加解密技术，禁止商用！
* 接口服务器为低配阿里云，无法承受并发，且作者随时关闭，请勿用于数据采集！
