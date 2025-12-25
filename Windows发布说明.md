# 说话岛助手 - Windows桌面应用发布说明

## 项目配置

本项目已配置为Windows桌面应用，支持自动更新功能。

## 已完成的配置

### 1. Tauri配置 (src-tauri/tauri.conf.json)
- 更新了产品名称为"说话岛助手"
- 添加了Windows特定的安装配置
- 配置了自动更新功能
- 设置了多语言支持 (中文和英文)

### 2. Cargo配置 (src-tauri/Cargo.toml)
- 添加了tauri-plugin-updater依赖
- 启用了shell-open功能

### 3. NPM配置 (package.json)
- 更新了项目名称为"说话岛助手"
- 添加了Windows构建脚本
- 添加了相关关键词和描述

## 构建命令

### 开发环境
```bash
npm run tauri:dev
```

### 生产构建
```bash
# 构建所有平台
npm run build:all

# 仅构建Windows版本
npm run build:win

# 构建Windows安装包
npm run build:win-installer
```

### 使用构建脚本
```bash
node build-windows.js
```

## 输出文件位置

- **开发版本**: `src-tauri/target/debug/`
- **发布版本**: `src-tauri/target/release/`
- **Windows安装包**: `src-tauri/target/release/bundle/nsis/`

## 自动更新配置

项目已配置Tauri自动更新功能：

1. **更新服务器**: 需要配置更新服务器地址
2. **更新检查**: 应用启动时会自动检查更新
3. **更新对话框**: 显示更新进度和详细信息
4. **静默安装**: 支持后台静默安装更新

## 发布流程

1. **准备发布**
   ```bash
   npm install
   npm run build:win-installer
   ```

2. **测试安装包**
   - 在虚拟机中测试安装过程
   - 验证所有功能正常工作
   - 测试自动更新功能

3. **代码签名** (生产环境)
   - 获取代码签名证书
   - 对安装包进行签名
   - 确保Windows SmartScreen信任

## 注意事项

1. **路径问题**: 确保所有路径使用Windows兼容格式
2. **权限**: 应用需要文件读写权限
3. **杀毒软件**: 可能需要添加到杀毒软件白名单
4. **Windows版本**: 支持Windows 10及以上版本

## 故障排除

### 构建失败
- 检查Rust工具链是否正确安装
- 确保Node.js版本兼容
- 清理缓存: `npm run clean`

### 运行时错误
- 检查Windows事件查看器
- 确保所有依赖文件正确打包
- 验证配置文件权限

### 更新问题
- 检查网络连接
- 验证更新服务器配置
- 确保更新包格式正确

## 版本管理

- 使用语义化版本控制 (如 0.1.0, 0.1.1, 0.2.0)
- 每次发布前更新版本号
- 在CHANGELOG中记录所有更改

## 下一步

1. 配置自动更新服务器
2. 设置CI/CD自动构建流程
3. 创建安装包的数字签名
4. 配置错误报告和日志收集系统