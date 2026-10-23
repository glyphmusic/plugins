//! Bindings for Glyph's plugin API. Copy this file into your plugin.
//!
//! Glyph runs the plugin in a sandbox and talks JSON with it:
//! - `request("player.next", json!({}))` calls Glyph and returns the
//!   answer (`Ok(value)` or `Err(message)`).
//! - Glyph calls the plugin's `glyph_event(len)` for each event; `event(len)`
//!   reads it.
//!
//! Reference: https://docs.glyph.my/plugins/api

use serde_json::{json, Value};

#[link(wasm_import_module = "glyph")]
extern "C" {
    #[link_name = "call"]
    fn glyph_call(ptr: *const u8, len: i32) -> i32;
    #[link_name = "read"]
    fn glyph_read(ptr: *mut u8) -> i32;
    #[link_name = "log"]
    fn glyph_log(level: i32, ptr: *const u8, len: i32) -> i32;
}

/// Copies Glyph's pending message (an answer or an event) of `len` bytes.
fn pending(len: i32) -> Value {
    let mut buf = vec![0u8; len.max(0) as usize];
    // SAFETY: Glyph writes exactly `len` bytes into the buffer we own.
    unsafe { glyph_read(buf.as_mut_ptr()) };
    serde_json::from_slice(&buf).unwrap_or(Value::Null)
}

/// Calls a Glyph function, like `request("ui.toast", json!({"text": "Hi"}))`.
pub fn request(func: &str, args: Value) -> Result<Value, String> {
    let req = json!({ "fn": func, "args": args }).to_string();
    // SAFETY: Glyph reads `len` bytes from our buffer during the call.
    let len = unsafe { glyph_call(req.as_ptr(), req.len() as i32) };
    let answer = pending(len);
    match answer.get("error").and_then(Value::as_str) {
        Some(e) => Err(e.to_string()),
        None => Ok(answer.get("ok").cloned().unwrap_or(Value::Null)),
    }
}

/// The event `glyph_event(len)` was called with.
pub fn event(len: i32) -> Value {
    pending(len)
}

fn log_at(level: i32, msg: &str) {
    // SAFETY: Glyph reads `len` bytes from our buffer during the call.
    unsafe { glyph_log(level, msg.as_ptr(), msg.len() as i32) };
}

/// A line in Glyph's log (shown on the plugin's page while it is local).
pub fn info(msg: &str) {
    log_at(1, msg);
}

pub fn warn(msg: &str) {
    log_at(2, msg);
}

/// A toast in Glyph (shown with the plugin's name in front).
pub fn toast(text: &str) {
    let _ = request("ui.toast", json!({ "text": text }));
}

/// A text in Glyph's language: one of the plugin's `strings` (keys start
/// with the plugin's id) or one of Glyph's own.
pub fn text(key: &str) -> String {
    request("app.text", json!({ "key": key })).ok().and_then(|v| v.as_str().map(str::to_string)).unwrap_or_else(|| key.to_string())
}
