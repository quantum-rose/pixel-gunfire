# 像素枪火 📚

使用 Cocos Creator 制作的像素风联机对战小游戏

[🚀 教程和素材来源](https://www.bilibili.com/video/BV1jW4y1M7uK/) 感谢 up 的无私奉献

[🎮 在线游玩](http://122.51.127.27:8080/) 腾讯云试用的服务器，随时可能挂掉

此分支用于测试 pnpm workspace，将服务端和客户端公共的代码提取为子包 `common`，并将 `common` 作为 `npm` 依赖在另外两个子包中导入使用，可正常预览与构建，但是 Cocos Creator 中没有热更新，`common` 发生修改后，必须重启 Cocos Creator 才能生效，刷新浏览器页面也不行，暂时无解，特开一个分支留以记录。
