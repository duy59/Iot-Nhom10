#include "esp_camera.h"
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include <NTPClient.h>
#include <WiFiUdp.h>

#define CAMERA_MODEL_AI_THINKER
#include "camera_pins.h"

// WiFi credentials
#define WIFI_SSID "Duybeos"
#define WIFI_PASSWORD "vuquangduy"

#define API_KEY "AIzaSyAUmPWMOmENxc3AiwojQvCCMj7HBKWafC4"
#define STORAGE_BUCKET_ID "appfirebase1-d1c0a.appspot.com"
#define DATABASE_URL "https://appfirebase1-d1c0a-default-rtdb.asia-southeast1.firebasedatabase.app/"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
bool signupOK = false;

// Control variables
String captureMode = "manual";
unsigned long lastCheckTime = 0;
unsigned long captureInterval = 3600000; 
const unsigned long CHECK_INTERVAL = 5000; 
bool lastCommandState = false;

// NTP Client
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 7 * 3600, 60000);

bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_QVGA;
  config.jpeg_quality = 12;
  config.fb_count = 1;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return false;
  }
  return true;
}

void uploadPhotoToFirebase() {
  Serial.println("\n=== Starting Photo Upload ===");
  Serial.println("Taking photo...");
  
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed!");
    return;
  }
  Serial.println("Photo captured successfully");

  char filename[32];
  sprintf(filename, "/photos/img_%lu.jpg", timeClient.getEpochTime());
  Serial.println("Generated filename: " + String(filename));
  
  Serial.println("Uploading to Firebase Storage...");
  if (Firebase.Storage.upload(&fbdo, STORAGE_BUCKET_ID, fb->buf, fb->len, filename, "image/jpeg")) {
    Serial.println("Upload successful!");
    
    String photoUrl = fbdo.downloadURL();
    String dbPath = "/photos/" + String(timeClient.getEpochTime());
    Serial.println("Photo URL: " + photoUrl);
    Serial.println("Saving URL to database at: " + dbPath);
    
    if (Firebase.RTDB.setString(&fbdo, dbPath, photoUrl)) {
      Serial.println("URL saved to database successfully");
    } else {
      Serial.println("Failed to save URL: " + fbdo.errorReason());
    }
  } else {
    Serial.println("Upload failed!");
    Serial.println("Error: " + fbdo.errorReason());
  }

  esp_camera_fb_return(fb);
  Serial.println("=== Upload Complete ===\n");
}

void checkFirebaseCommands() {
  Serial.println("\n--- Checking Firebase Commands ---");
  if (!Firebase.ready() || !signupOK) {
    Serial.println("Firebase not ready or not authenticated");
    return;
  }
  
  // Check mode
  Serial.print("Checking capture mode... ");
  if (Firebase.RTDB.getString(&fbdo, "/capture/mode")) {
    String newMode = fbdo.stringData();
    if (newMode != captureMode) {
      captureMode = newMode;
      Serial.println("Mode changed to: " + captureMode);
    } else {
      Serial.println("Current mode: " + captureMode);
    }
  } else {
    Serial.println("Failed to get mode: " + fbdo.errorReason());
  }

  // Check interval
  Serial.print("Checking capture interval... ");
  if (Firebase.RTDB.getInt(&fbdo, "/capture/interval")) {
    long newInterval = fbdo.intData();
    if (newInterval > 0 && newInterval * 1000 != captureInterval) {
      captureInterval = newInterval * 1000;
      Serial.println("Interval updated to " + String(newInterval) + " seconds");
    } else {
      Serial.println("Current interval: " + String(captureInterval/1000) + " seconds");
    }
  } else {
    Serial.println("Failed to get interval: " + fbdo.errorReason());
  }

  if (captureMode == "auto") {
    static unsigned long lastAutoCapture = 0;
    Serial.println("Auto mode - Time since last capture: " + String((millis() - lastAutoCapture)/1000) + "s");
    Serial.println("Next capture in: " + String((captureInterval - (millis() - lastAutoCapture))/1000) + "s");
    
    if (millis() - lastAutoCapture > captureInterval) {
      Serial.println("Auto capture triggered!");
      uploadPhotoToFirebase();
      lastAutoCapture = millis();
    }
  } else {
    Serial.print("Checking capture command... ");
    if (Firebase.RTDB.getBool(&fbdo, "/capture/command")) {
      bool currentCommand = fbdo.boolData();
      Serial.println("Command is: " + String(currentCommand ? "TRUE" : "FALSE"));
      
      if (currentCommand && !lastCommandState) {
        Serial.println("Manual capture triggered!");
        uploadPhotoToFirebase();
        Serial.println("Resetting command to false...");
        if (Firebase.RTDB.setBool(&fbdo, "/capture/command", false)) {
          Serial.println("Command reset successful");
        } else {
          Serial.println("Command reset failed: " + fbdo.errorReason());
        }
      }
      lastCommandState = currentCommand;
    } else {
      Serial.println("Failed to get command: " + fbdo.errorReason());
    }
  }
  
  Serial.println("--- Check Complete ---\n");
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Starting ESP32-CAM ===");
  
  Serial.println("Initializing camera...");
  if (!initCamera()) {
    Serial.println("Camera init failed!");
    return;
  }
  Serial.println("Camera initialized successfully");

  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.println("IP address: " + WiFi.localIP().toString());

  Serial.println("Initializing Firebase...");
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase signup OK");
    signupOK = true;
  } else {
    Serial.printf("Firebase signup failed: %s\n", config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("Waiting for Firebase connection...");
  while (!Firebase.ready()) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("\nFirebase connected!");

  Serial.println("Initializing time client...");
  timeClient.begin();
  timeClient.update();
  Serial.println("Time client initialized");
  
  Serial.println("=== Setup Complete ===\n");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(5000);
    return;
  }

  timeClient.update();

  if (millis() - lastCheckTime > CHECK_INTERVAL) {
    checkFirebaseCommands();
    lastCheckTime = millis();
  }
  
  delay(100);
}