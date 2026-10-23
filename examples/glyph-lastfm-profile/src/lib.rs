mod glyph;
use serde_json::{json, Value};

fn encode(value: &str) -> String {
    value.bytes().map(|b| if b.is_ascii_alphanumeric() || b"-._~".contains(&b) {
        (b as char).to_string()
    } else { format!("%{b:02X}") }).collect()
}

fn lookup() -> Result<String, String> {
    let user = glyph::request("ui.get", json!({"id":"username"}))?;
    let user = user.as_str().unwrap_or("").trim();
    if user.is_empty() { return Err("Enter a Last.fm user name first.".into()); }
    let response = glyph::request("net.fetch", json!({
        "url":format!("https://ws.audioscrobbler.com/2.0/?method=user.getinfo&format=json&user={}", encode(user)),
        "credentials":{"query":{"api_key":"api_key"}}
    }))?;
    if response["status"] != 200 { return Err("Last.fm could not load the profile.".into()); }
    let body: Value = serde_json::from_str(response["body"].as_str().unwrap_or(""))
        .map_err(|_| "Last.fm returned an invalid response.".to_string())?;
    let profile = &body["user"];
    let name = profile["name"].as_str().ok_or_else(|| "Check your Last.fm key and user name.".to_string())?;
    Ok(format!("{} · {} plays", name, profile["playcount"].as_str().unwrap_or("0")))
}

#[no_mangle]
pub extern "C" fn glyph_event(len: i32) {
    let event = glyph::event(len);
    if event["type"] == "action" && event["id"] == "lookup" {
        let status = lookup().unwrap_or_else(|message| message);
        let _ = glyph::request("ui.update", json!({"id":"result","status":status}));
    }
}
