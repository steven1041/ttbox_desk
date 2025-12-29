// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use encoding_rs::GBK;
use std::fs;
use std::path::Path;
use tauri_plugin_updater::UpdaterExt;
use tauri::Emitter;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// 获取 API 基础 URL
fn get_api_base_url() -> String {
    "http://127.0.0.1:8008".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct User {
    email: String,
    password: String,
    id: Option<String>,
    created_at: Option<String>,
}

#[derive(Debug, Serialize)]
struct AuthResponse {
    success: bool,
    user: Option<User>,
    message: Option<String>,
}

// 简单的内存用户存储（生产环境应使用数据库）
static mut USERS: Option<HashMap<String, User>> = None;

fn init_users() {
    unsafe {
        if USERS.is_none() {
            USERS = Some(HashMap::new());
        }
    }
}

fn get_users() -> &'static mut HashMap<String, User> {
    unsafe {
        init_users();
        USERS.as_mut().unwrap()
    }
}

#[tauri::command]
async fn greet(name: String) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn login(email: String, password: String) -> Result<AuthResponse, String> {
    println!("尝试登录: {}", email);
    
    // 验证邮箱格式
    if !email.contains('@') || !email.contains('.') {
        return Ok(AuthResponse {
            success: false,
            user: None,
            message: Some("请输入有效的邮箱地址".to_string()),
        });
    }
    
    // 验证密码长度
    if password.len() != 8 {
        return Ok(AuthResponse {
            success: false,
            user: None,
            message: Some("密码必须是8位".to_string()),
        });
    }
    
    let users = get_users();
    
    if let Some(user) = users.get(&email) {
        if user.password == password {
            println!("登录成功: {}", email);
            Ok(AuthResponse {
                success: true,
                user: Some(user.clone()),
                message: None,
            })
        } else {
            Ok(AuthResponse {
                success: false,
                user: None,
                message: Some("密码错误".to_string()),
            })
        }
    } else {
        Ok(AuthResponse {
            success: false,
            user: None,
            message: Some("用户不存在".to_string()),
        })
    }
}

#[tauri::command]
async fn register(email: String, password: String) -> Result<AuthResponse, String> {
    println!("尝试注册: {}", email);
    
    // 验证邮箱格式
    if !email.contains('@') || !email.contains('.') {
        return Ok(AuthResponse {
            success: false,
            user: None,
            message: Some("请输入有效的邮箱地址".to_string()),
        });
    }
    
    // 验证密码长度
    if password.len() != 8 {
        return Ok(AuthResponse {
            success: false,
            user: None,
            message: Some("密码必须是8位".to_string()),
        });
    }
    
    let users = get_users();
    
    if users.contains_key(&email) {
        Ok(AuthResponse {
            success: false,
            user: None,
            message: Some("用户已存在".to_string()),
        })
    } else {
        let new_user = User {
            email: email.clone(),
            password,
            id: Some(uuid::Uuid::new_v4().to_string()),
            created_at: Some(chrono::Utc::now().to_rfc3339()),
        };
        
        users.insert(email.clone(), new_user.clone());
        println!("注册成功: {}", email);
        
        Ok(AuthResponse {
            success: true,
            user: Some(new_user),
            message: None,
        })
    }
}

#[tauri::command]
fn decode_gbk_text(text: String) -> Result<String, String> {
    // 将字符串转换为字节
    let bytes = text.as_bytes();
    
    // 使用GBK解码
    let (decoded_text, _, _) = GBK.decode(bytes);
    
    // 如果解码成功，返回解码后的文本
    // 否则返回原始文本
    if !decoded_text.is_empty() && text.contains('�') {
        Ok(decoded_text.to_string())
    } else {
        Ok(text)
    }
}

#[tauri::command]
async fn read_file_content(file_path: String) -> Result<String, String> {
    // 首先尝试以UTF-8读取
    match fs::read(&file_path) {
        Ok(bytes) => {
            // 尝试UTF-8解码
            match std::str::from_utf8(&bytes) {
                Ok(content) => Ok(content.to_string()),
                Err(_) => {
                    // 如果UTF-8失败，尝试GBK解码
                    let (decoded_content, _, _) = GBK.decode(&bytes);
                    Ok(decoded_content.to_string())
                }
            }
        },
        Err(e) => Err(format!("读取文件失败: {}", e)),
    }
}

#[tauri::command]
async fn write_file_content(file_path: String, content: String) -> Result<(), String> {
    // 确保父目录存在
    if let Some(parent) = Path::new(&file_path).parent() {
        if !parent.exists() {
            if let Err(e) = fs::create_dir_all(parent) {
                return Err(format!("创建目录失败: {}", e));
            }
        }
    }
    
    // 先尝试修改文件属性为可写（仅Windows）
    #[cfg(target_os = "windows")]
    {
        if let Ok(metadata) = fs::metadata(&file_path) {
            let mut permissions = metadata.permissions();
            permissions.set_readonly(false);
            if let Err(e) = fs::set_permissions(&file_path, permissions) {
                return Err(format!("修改文件权限失败: {}", e));
            }
        }
    }
    
    // 将UTF-8内容编码为GBK字节后写入文件
    match encode_to_gbk(content) {
        Ok(gbk_bytes) => {
            match fs::write(&file_path, gbk_bytes) {
                Ok(_) => Ok(()),
                Err(e) => Err(format!("写入文件失败: {} (路径: {})", e, file_path)),
            }
        }
        Err(e) => Err(format!("GBK编码失败: {}", e)),
    }
}

#[tauri::command]
async fn write_file_content_gbk(file_path: String, content: String) -> Result<(), String> {
    // 确保父目录存在
    if let Some(parent) = Path::new(&file_path).parent() {
        if !parent.exists() {
            if let Err(e) = fs::create_dir_all(parent) {
                return Err(format!("创建目录失败: {}", e));
            }
        }
    }
    
    // 先尝试修改文件属性为可写（仅Windows）
    #[cfg(target_os = "windows")]
    {
        if let Ok(metadata) = fs::metadata(&file_path) {
            let mut permissions = metadata.permissions();
            permissions.set_readonly(false);
            if let Err(e) = fs::set_permissions(&file_path, permissions) {
                return Err(format!("修改文件权限失败: {}", e));
            }
        }
    }
    
    // 将UTF-8内容编码为GBK字节后写入文件
    match encode_to_gbk(content) {
        Ok(gbk_bytes) => {
            match fs::write(&file_path, gbk_bytes) {
                Ok(_) => Ok(()),
                Err(e) => Err(format!("GBK写入文件失败: {} (路径: {})", e, file_path)),
            }
        }
        Err(e) => Err(format!("GBK编码失败: {}", e)),
    }
}

#[tauri::command]
async fn check_file_exists(file_path: String) -> Result<bool, String> {
    Ok(Path::new(&file_path).exists())
}

#[tauri::command]
async fn read_directory(dir_path: String) -> Result<Vec<DirEntry>, String> {
    match fs::read_dir(&dir_path) {
        Ok(entries) => {
            let mut result = Vec::new();
            for entry in entries {
                match entry {
                    Ok(entry) => {
                        let path = entry.path();
                        let name = path.file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or("")
                            .to_string();
                        let is_dir = path.is_dir();
                        result.push(DirEntry { name, is_dir });
                    }
                    Err(e) => return Err(format!("读取目录条目失败: {}", e)),
                }
            }
            Ok(result)
        }
        Err(e) => Err(format!("读取目录失败: {}", e)),
    }
}

#[tauri::command]
async fn set_file_readonly(file_path: String, readonly: bool) -> Result<(), String> {
    match fs::metadata(&file_path) {
        Ok(metadata) => {
            let mut permissions = metadata.permissions();
            permissions.set_readonly(readonly);
            match fs::set_permissions(&file_path, permissions) {
                Ok(_) => Ok(()),
                Err(e) => Err(format!("设置文件权限失败: {}", e)),
            }
        }
        Err(e) => Err(format!("获取文件元数据失败: {}", e)),
    }
}

#[tauri::command]
async fn is_file_readonly(file_path: String) -> Result<bool, String> {
    match fs::metadata(&file_path) {
        Ok(metadata) => {
            Ok(metadata.permissions().readonly())
        }
        Err(e) => Err(format!("获取文件元数据失败: {}", e)),
    }
}

#[tauri::command]
fn encode_to_gbk(text: String) -> Result<Vec<u8>, String> {
    use encoding_rs::GBK;
    
    // 将UTF-8字符串编码为GBK字节
    let (bytes, _, _) = GBK.encode(&text);
    Ok(bytes.to_vec())
}

#[tauri::command]
async fn check_for_updates(app: tauri::AppHandle) -> Result<bool, String> {
    println!("开始检查更新...");
    match app.updater_builder().build() {
        Ok(updater) => {
            println!("更新器初始化成功，开始检查远程版本...");
            match updater.check().await {
                Ok(update) => {
                    if let Some(update) = update {
                        println!("发现新版本: {} (当前版本: {})", update.version, app.package_info().version);
                        Ok(true)
                    } else {
                        println!("没有可用的更新，当前版本: {} 已是最新", app.package_info().version);
                        Ok(false)
                    }
                }
                Err(e) => {
                    println!("检查更新时发生错误: {}", e);
                    Err(format!("检查更新失败: {}", e))
                },
            }
        }
        Err(e) => {
            println!("更新器初始化失败: {}", e);
            Err(format!("更新器初始化失败: {}", e))
        },
    }
}

#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    match app.updater_builder().build() {
        Ok(updater) => {
            match updater.check().await {
                Ok(update) => {
                    if let Some(update) = update {
                        // 下载进度回调
                        let on_chunk = |chunk_size: usize, total_size: Option<u64>| {
                            let percent = if let Some(total) = total_size {
                                (chunk_size as f64 / total as f64 * 100.0) as u32
                            } else {
                                0
                            };
                            println!("下载进度: {}%", percent);
                            
                            // 发送进度事件到前端
                            let _ = app.emit_to("main", "update_progress", percent);
                        };
                        
                        // 下载完成回调
                        let on_download_finish = || {
                            println!("下载完成，开始安装");
                            // 发送下载完成事件到前端
                            let _ = app.emit_to("main", "update_progress", 100);
                        };
                        
                        match update.download_and_install(on_chunk, on_download_finish).await {
                            Ok(_) => {
                                println!("更新安装成功");
                                Ok(())
                            }
                            Err(e) => Err(format!("安装更新失败: {}", e)),
                        }
                    } else {
                        Err("没有可用的更新".to_string())
                    }
                }
                Err(e) => Err(format!("检查更新失败: {}", e)),
            }
        }
        Err(e) => Err(format!("更新器初始化失败: {}", e)),
    }
}

#[derive(serde::Serialize)]
struct DirEntry {
    name: String,
    is_dir: bool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init()) // 初始化dialog插件
        .plugin(tauri_plugin_shell::init()) // 初始化shell插件
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_updater::Builder::new().build());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            decode_gbk_text,
            read_file_content,
            write_file_content,
            write_file_content_gbk,
            check_file_exists,
            read_directory,
            set_file_readonly,
            is_file_readonly,
            encode_to_gbk,
            check_for_updates,
            install_update,
            login,
            register
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
