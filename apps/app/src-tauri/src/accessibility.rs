use accessibility_sys::{kAXTrustedCheckOptionPrompt, AXIsProcessTrustedWithOptions};
use core_foundation_sys::base::{CFRelease, TCFTypeRef};
use core_foundation_sys::dictionary::{
    CFDictionaryAddValue, CFDictionaryCreateMutable, __CFDictionary,
};
use core_foundation_sys::number::{kCFBooleanFalse, kCFBooleanTrue};
use std::process::Command;
use std::ptr;

#[tauri::command]
pub fn is_macos_accessibility_enabled(ask_if_not_allowed: bool) -> Result<bool, &'static str> {
    let options = create_options_dictionary(ask_if_not_allowed)?;
    let is_allowed = unsafe { AXIsProcessTrustedWithOptions(options) };
    release_options_dictionary(options);
    Ok(is_allowed)
}

fn create_options_dictionary(
    ask_if_not_allowed: bool,
) -> Result<*mut __CFDictionary, &'static str> {
    unsafe {
        let options = CFDictionaryCreateMutable(ptr::null_mut(), 0, ptr::null(), ptr::null());
        if options.is_null() {
            return Err("Failed to create options dictionary");
        }
        let key = kAXTrustedCheckOptionPrompt;
        let value = if ask_if_not_allowed {
            kCFBooleanTrue
        } else {
            kCFBooleanFalse
        };
        CFDictionaryAddValue(options, key.as_void_ptr(), value.as_void_ptr());
        Ok(options)
    }
}

fn release_options_dictionary(options: *mut __CFDictionary) {
    unsafe {
        CFRelease(options as *const _);
    }
}

#[tauri::command]
pub async fn open_apple_accessibility() -> Result<(), String> {
    Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
        .status()
        .map_err(|e| format!("Failed to execute command: {}", e))
        .and_then(|status| {
            if status.success() {
                Ok(())
            } else {
                Err(format!("Command failed with status: {}", status))
            }
        })
}
