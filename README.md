# 注意：因目标网站已于8月初改版，本接口已失效！

# 中国商标网加密接口

# 参考
* [瑞数分析第一篇](https://segmentfault.com/a/1190000017286304) - 记录了一些早期的摸索和分析
* [瑞数分析第二篇](https://segmentfault.com/a/1190000017541235) - 深入一些的分析和总结
* [瑞数加密原理简析](https://segmentfault.com/a/1190000018311861) - 原理流程整理
* [Javascript逆向技术QQ群](https://jq.qq.com/?_wv=1027&k=5Bcu3YU) - 可联系作者本人

# 概述
[中国商标网](http://wsjs.saic.gov.cn)使用了国内安全公司[瑞数信息](https://www.riversecurity.com.cn)的Botgate前端加密技术。以下为官网介绍：
>Botgate以“动态防护”技术为核心，通过对服务器网页底层代码的持续动态变换，增加服务器行为的“不可预测性”；对企业内、外网的应用提供主动防护，不仅可以防护传统攻击行为，还可以有效防御传统防护手段乏力的自动化攻击。
>Botgate通过动态封装、动态验证、动态混淆、动态令牌等创新技术实现了从用户端到服务器端的全方位“主动防护”，为各类Web、HTML5提供强大的安全保护。让攻击者无从下手，从而大幅提升了攻击的难度！

综上，瑞数加密是一种强度极高的前端加密技术，堪称反爬界的集大成者。

# 项目说明
* 本接口解析上传的网页内容中的`<meta id="9DhefwqGPrzGxEp9hPaoag">`等加密信息，生成包含`FSSBBIl1UgzbN7N80T`, `MmEwMD`, `y7bRbp`, `c1K5tw0w6_`等密文的合法请求参数。
* 随机生成浏览器指纹，避免被大数据标记。
* 提供GraphQL API，方便客户端以灵活的顺序调用。
* 本接口并不访问中国商标网，仅用于为客户端生成加密后请求参数，需要客户端自行解决IP封禁问题。
* 本仓库仅包括一个简单的命令行例程，用于演示接口调用方法。
* 不支持商标详情页。

# 接口地址
  http://39.100.136.50/saic/
  
  注意：
  * 仅支持POST，请求体为application/json格式的GraphQL查询，形如：{"query": "...", "variables": {...}}
  * 必须添加token请求头，内容为首次请求首页获得的FSSBBIl1UgzbN7N80S cookie值

# 关于DEMO
* 调用方法
  `node gql_demo.js --mn=鸿蒙 --nc=9`
* 命令行参数说明
  * --nc: 国际分类，1~45间的数字
  * --sn: 申请/注册号，数字
  * --mn: 商标名称中文关键字
  * --hnc: 申请人名称中文关键字

# 工作流程
1. 客户端不带任何cookie请求中国商标网首页，目的是获取F80S cookie值
1. 客户端以首页内容和查询参数请求本接口，获取到/txnRead01.do（列表页）的加密后完整请求参数
1. 使用获取到的请求参数请求列表页
1. 以列表页内容和查询参数请求本接口，获取到/txnRead02.ajax（列表页XHR数据接口，XML格式）的加密后完整请求参数
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
  # 包含密文的完整的请求url
  url: String!
  # 请求方法GET/POST，缺省则为GET
  method: String
  # 额外请求头。如存在，则必成对出现
  headers: [String!]
  # POST请求体
  body: String
}
# 商标网查询参数，见前面的"命令行参数说明"
input SaicArgs {
  nc: Int
  sn: Int
  mn: String
  hnc: String
  # 页码，适用于/txnRead02.ajax
  page: Int
  # 从/txnRead02.ajax返回的xml中提取，第一页不需要
  tlong: String
}
```

# 声明
* 本接口后台服务器不保留任何数据，请勿向作者索取！
* 作者与中国商标网和瑞数信息无利益关系，开发此接口仅出于兴趣，如侵犯了您的合法权益，请在issue区提出！
* 本接口仅用于研究javascript加解密技术，严禁商用！
* 接口服务器为低配阿里云，无法承受并发，仅用于演示，作者随时关闭，切勿用于数据采集！
