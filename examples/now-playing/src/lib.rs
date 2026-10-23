//! Now Playing Toast: an example Glyph extension.
//!
//! - Shows the new song in a toast (setting: on/off, title or title and
//!   artist), with a button to try it.
//! - Counts the songs it announced (kept in the plugin's storage) and shows
//!   the number on its settings page.
//! - Adds "More by this artist" to the song menu.
//!
//! Everything happens in `glyph_event`: Glyph sends an event, the plugin
//! answers with calls (`glyph::request`).

mod glyph;

use serde_json::{json, Value};

/// Called once when Glyph starts the plugin.
#[no_mangle]
pub extern "C" fn glyph_start() {
    glyph::info("now-playing-toast started");
}

/// Called with every event (see https://docs.glyph.my/plugins/api#events).
#[no_mangle]
pub extern "C" fn glyph_event(len: i32) {
    let ev = glyph::event(len);
    match ev["type"].as_str().unwrap_or("") {
        // First event: settings and what plays right now.
        "ready" => show_count(),
        "track" => {
            let song = &ev["song"];
            if !song.is_null() && setting("enabled").as_bool().unwrap_or(true) {
                announce(song);
            }
        }
        // The user pressed "Show a toast".
        "action" if ev["id"] == "test" => {
            match glyph::request("player.state", json!({})) {
                Ok(state) if !state["song"].is_null() => announce(&state["song"]),
                Ok(_) => glyph::toast(&glyph::text("now-playing-toast.now")),
                Err(e) => glyph::warn(&e),
            }
        }
        // "More by this artist" in the song menu.
        "menu" if ev["id"] == "more" => {
            if let Some(artist) = ev["song"]["artist"].as_str() {
                let _ = glyph::request("ui.open_artist", json!({ "name": artist }));
            }
        }
        _ => {}
    }
}

/// The value of one of the plugin's settings rows.
fn setting(id: &str) -> Value {
    glyph::request("ui.get", json!({ "id": id })).unwrap_or(Value::Null)
}

fn announce(song: &Value) {
    let title = song["title"].as_str().unwrap_or("?");
    let text = match setting("format").as_str() {
        Some("title") => title.to_string(),
        _ => format!("{title} – {}", song["artist"].as_str().unwrap_or("?")),
    };
    glyph::toast(&format!("{}: {text}", glyph::text("now-playing-toast.now")));
    let n = glyph::request("storage.get", json!({ "key": "count" })).ok().and_then(|v| v.as_u64()).unwrap_or(0) + 1;
    let _ = glyph::request("storage.set", json!({ "key": "count", "value": n }));
    show_count();
}

/// Puts the number of announced songs on the settings page.
fn show_count() {
    let n = glyph::request("storage.get", json!({ "key": "count" })).ok().and_then(|v| v.as_u64()).unwrap_or(0);
    let _ = glyph::request("ui.update", json!({ "id": "count", "status": n.to_string() }));
}
