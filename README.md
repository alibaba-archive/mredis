### Muilt Redis  
开启多redis server

#### 实现功能   
 * 绑定多个redis server   
 * 常用的```get```,```set```,```del```,```exist```等方法支持   
 * ```connect```, ```end```, ```error```事件支持   
 * 多写单读，可以通过```options.speedFirst```开启优先读取响应时间短的server，否则轮询读取   

#### 使用方法
  参照```test.js```文件  
  
#### 安装   
```npm install mredis```   
如果希望在```express```或者```connect```上使用，请安装```connect-redis```的```mredis```版本:```npm install connect-mredis```，在```express```中初始化的时候需要换成```mredis```的参数。

#### 依赖   
node-redis: ```npm install redis```   

#### TODO
 * 更多方法和事件支持
 * 有待详细测试   