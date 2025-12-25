// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use encoding_rs::GBK;
use std::fs;
use std::path::Path;
use tauri_plugin_updater::UpdaterExt;

#[tauri::command]
async fn greet(name: String) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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
    match app.updater_builder().build() {
        Ok(updater) => {
            match updater.check().await {
                Ok(update) => {
                    if let Some(update) = update {
                        println!("Update available: {}", update.version);
                        Ok(true)
                    } else {
                        println!("No update available");
                        Ok(false)
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
            check_for_updates
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
