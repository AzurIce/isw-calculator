// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use std::fs;

// #[tauri::command]
// fn write_json(content: String) -> Result<(), String> {
//     if let Some(path) = rfd::FileDialog::new()
//         .set_directory("./")
//         .add_filter("json", &["json"])
//         .save_file()
//     {
//         return fs::write(path, content.as_bytes())
//             .map_err(|err| format!("save_to_file error: {}", err));
//     }
//     // fs::write(path, contents);
//     Ok(())
// }

// #[tauri::command]
// fn read_json() -> Result<String, String> {
//     rfd::FileDialog::new()
//         .set_directory("./")
//         .add_filter("json", &["json"])
//         .pick_file()
//         .ok_or(format!("no file selected"))
//         .and_then(|path| {
//             fs::read_to_string(path).map_err(|err| format!("save_to_file error: {}", err))
//         })
// }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![/*read_json, write_json*/])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
