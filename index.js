import dotenv from "dotenv";
dotenv.config();



import express from "express";
import axios from "axios";
import fs from "fs"; 
import { google } from "googleapis"; 
import {  authorize,addRainEvent, getAuthUrl } from "./calendar.js";




const app = express();
//const port = 3000;

const port = process.env.PORT || 3000;
const apiUrl = process.env.WEATHER_API_URL;
const apiKey = process.env.WEATHER_API_KEY;
const location = process.env.WEATHER_LOCATION;


app.set("view engine", "ejs"); 

app.get("/", (req, res) => {
  res.render("index.ejs", { content: "Welcome! Go to /apiKey to check rain forecast." });
});


app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;

  try {
    const credentials = JSON.parse(fs.readFileSync("credentials.json"));
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync("token.json", JSON.stringify(tokens));

    // Check if there was a pending rain event
    if (fs.existsSync("pendingEvent.json")) {
      const { date, rainMessage } = JSON.parse(fs.readFileSync("pendingEvent.json"));
      await addRainEvent(oAuth2Client, date, rainMessage);
      fs.unlinkSync("pendingEvent.json");
    }

    res.send("Authorization successful and event added to Google Calendar! You can now close this tab.");
  } catch (error) {
    console.error("OAuth callback error:", error.message);
    res.status(500).send("Authorization failed.");
  }
});



  
app.get("/apiKey", async (req, res) => {
  try {
    const result = await axios.get(apiUrl, {
      params: {
        key: apiKey,
        q: location,
        aqi: "no",
        days: 2,
      },
    });
    


    const forecast = result.data.forecast.forecastday[1]; // tomorrow
    const date = forecast.date;
    const willItRain = forecast.day.daily_will_it_rain;
    const chance = forecast.day.daily_chance_of_rain;
    const condition = forecast.day.condition.text;

    let rainMessage = "";
    if (true) {
      rainMessage = `It might rain on ${date}. Chance: ${chance}%. Condition: ${condition}`;

      // Check if user is already authenticated
      if (fs.existsSync("token.json")) {
        const auth = await authorize();
        await addRainEvent(auth, date, rainMessage);
      } else {
        // Save message and date to session or file for reuse after auth
        fs.writeFileSync("pendingEvent.json", JSON.stringify({ date, rainMessage }));
        return res.redirect("/authorize");
      }
    } else {
      rainMessage = `No rain expected on ${date}.`;
    }

    res.render("index.ejs", { content: rainMessage });
  } catch (error) {
    res.status(500).send("Error fetching weather data: " + error.message);
  }
});



app.get("/authorize", (req, res) => {
  const url = getAuthUrl();
  res.redirect(url); // Redirect user to Google sign-in
});




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// wrks
/* complete api project successfully. you did yakin, im' proud myself your not lazy or dump. you have something kind shit which i have in my brain

1. how safely my apikeys.
*/
