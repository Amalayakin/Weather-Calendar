import fs from "fs";
import readline from "readline";
import { google } from "googleapis";
import open from "open";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const TOKEN_PATH = "token.json";

// Load client secrets from a local file
// Only generate and return the auth URL
export function getAuthUrl() {
  const credentials = JSON.parse(fs.readFileSync("credentials.json"));
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });

  return authUrl;
}

export async function authorize() {
  const credentials = JSON.parse(fs.readFileSync("credentials.json"));
  const { client_secret, client_id, redirect_uris } = credentials.web;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Load previously saved token
  const token = JSON.parse(fs.readFileSync("token.json"));
  oAuth2Client.setCredentials(token);

  return oAuth2Client;
}



export async function addRainEvent(auth, date, message) {
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary: "🌧️ Weather Alert",
    description: message,
    start: { date },
    end: { date },
  };

  await calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });

  console.log("Event added to calendar");
}
