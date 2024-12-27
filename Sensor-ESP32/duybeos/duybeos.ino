#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include "DHT.h"
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ESP32Servo.h>

#define WIFI_SSID "Duybeos"
#define WIFI_PASSWORD "vuquangduy"

#define LED_PIN 19    
#define FAN_PIN 18    
#define MIST_PIN 21   
#define LDR_PIN 34
#define DHT_PIN 4
#define SERVO_PIN 13  

#define maxLux 500
#define DHTTYPE DHT11

#define API_KEY "AIzaSyAUmPWMOmENxc3AiwojQvCCMj7HBKWafC4"
#define DATABASE_URL "https://appfirebase1-d1c0a-default-rtdb.asia-southeast1.firebasedatabase.app/"

DHT dht(DHT_PIN, DHTTYPE);

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

FirebaseData fbdoFirestore;

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 7 * 3600, 60000); 

Servo sg90;

unsigned long sendDataPrevMillis = 0;
bool signupOK = false;


int ldrData = 0;
float temperature = 0.0;
float humidity = 0.0;

long term = 10000; 
long nextSpinTime = 0;
bool spinDirection = false;
bool servoEnabled = true;


String projectID;

void tokenStatusCallback(firebase_auth_token_info_t info) {
  if (info.status == token_status_error) {
    Serial.printf("Token error: %s\n", info.error.message.c_str());
  }
}

void setup() {
  Serial.begin(115200);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  String url = DATABASE_URL;
  int startIndex = url.indexOf("https://") + 8;
  int endIndex = url.indexOf("-default-rtdb");
  projectID = url.substring(startIndex, endIndex);
  Serial.print("Project ID: ");
  Serial.println(projectID);

  dht.begin();

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Sign up OK");
    signupOK = true;
  } else {
    Serial.printf("Sign up failed: %s\n", config.signer.signupError.message.c_str());
  }

  pinMode(LED_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(MIST_PIN, OUTPUT);

  sg90.setPeriodHertz(50);
  sg90.attach(SERVO_PIN, 500, 2400);
  Serial.println("Servo initialized.");

  if (!Firebase.RTDB.getBool(&fbdo, "/servo/enabled")) {
    servoEnabled = true;
    if (Firebase.RTDB.setBool(&fbdo, "/servo/enabled", servoEnabled)) {
      Serial.println("Created '/servo/enabled' with default value: true");
    } else {
      Serial.println("Failed to create '/servo/enabled': " + fbdo.errorReason());
    }
  } else {
    servoEnabled = fbdo.boolData();
    Serial.print("Servo enabled: ");
    Serial.println(servoEnabled);
  }

  if (!Firebase.RTDB.getInt(&fbdo, "/servo/term")) {
    term = 10000;
    if (Firebase.RTDB.setInt(&fbdo, "/servo/term", term)) {
      Serial.println("Created '/servo/term' with default value: 10000");
    } else {
      Serial.println("Failed to create '/servo/term': " + fbdo.errorReason());
    }
  } else {
    term = fbdo.intData();
    Serial.print("Term: ");
    Serial.println(term);
  }

  nextSpinTime = millis() + term;

  timeClient.begin();
  Serial.println("NTP Client started.");

  Serial.print("Waiting for NTP time sync");
  while(!timeClient.update()){
    timeClient.forceUpdate();
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nNTP time synchronized.");
}

void loop() {
  timeClient.update();

  if (Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > 5000 || sendDataPrevMillis == 0)) {
    sendDataPrevMillis = millis();
    Serial.println("Reading sensors and updating Firebase...");

    ldrData = analogRead(LDR_PIN);
    float voltage = ldrData * (3.3 / 4095.0);
    float lux = 500 - (voltage / 3.3) * maxLux;

    humidity = dht.readHumidity();
    temperature = dht.readTemperature();

    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("Failed to read from DHT sensor!");
      return;
    }

    if (Firebase.RTDB.setFloat(&fbdo, "Sensor/lux", lux)) {
      Serial.println("Lux value updated successfully.");
    } else {
      Serial.println("FAILED: " + fbdo.errorReason());
    }

    if (Firebase.RTDB.setFloat(&fbdo, "Sensor/temperature", temperature)) {
      Serial.println("Temperature value updated successfully.");
    } else {
      Serial.println("FAILED: " + fbdo.errorReason());
    }

    if (Firebase.RTDB.setFloat(&fbdo, "Sensor/humidity", humidity)) {
      Serial.println("Humidity value updated successfully.");
    } else {
      Serial.println("FAILED: " + fbdo.errorReason());
    }

    time_t now = timeClient.getEpochTime();

    struct tm *timeInfo = localtime(&now); 
    char timestampStr[30];
    snprintf(timestampStr, sizeof(timestampStr), "%04d-%02d-%02dT%02d:%02d:%02d+07:00",
             timeInfo->tm_year + 1900, timeInfo->tm_mon + 1, timeInfo->tm_mday,
             timeInfo->tm_hour, timeInfo->tm_min, timeInfo->tm_sec);

    bool ledState = false;
    if (Firebase.RTDB.getBool(&fbdo, "devices/LED/state")) {
      ledState = fbdo.boolData();
      Serial.println("LED state updated.");
    } else {
      Serial.println("LED state not found. Creating with default value.");
      if (Firebase.RTDB.setBool(&fbdo, "devices/LED/state", false)) {
        Serial.println("LED state created with default value false.");
      } else {
        Serial.println("Failed to create LED state: " + fbdo.errorReason());
      }
    }
    digitalWrite(LED_PIN, ledState ? HIGH : LOW);

    bool fanState = false;
    if (Firebase.RTDB.getBool(&fbdo, "devices/FAN/state")) {
      fanState = fbdo.boolData();
      Serial.println("FAN state updated.");
    } else {
      Serial.println("FAN state not found. Creating with default value.");
      if (Firebase.RTDB.setBool(&fbdo, "devices/FAN/state", false)) {
        Serial.println("FAN state created with default value false.");
      } else {
        Serial.println("Failed to create FAN state: " + fbdo.errorReason());
      }
    }
    digitalWrite(FAN_PIN, fanState ? HIGH : LOW);

    bool mistState = false;
    if (Firebase.RTDB.getBool(&fbdo, "devices/Mist/state")) {
      mistState = fbdo.boolData();
      Serial.println("Mist state updated.");
    } else {
      Serial.println("Mist state not found. Creating with default value.");
      if (Firebase.RTDB.setBool(&fbdo, "devices/Mist/state", false)) {
        Serial.println("Mist state created with default value false.");
      } else {
        Serial.println("Failed to create Mist state: " + fbdo.errorReason());
      }
    }
    digitalWrite(MIST_PIN, mistState ? HIGH : LOW);

    if (Firebase.RTDB.getBool(&fbdo, "/servo/enabled")) {
      servoEnabled = fbdo.boolData();
      Serial.print("Servo enabled: ");
      Serial.println(servoEnabled);
    } else {
      Serial.println("Servo enabled not found. Creating with default value.");
      servoEnabled = true;
      if (Firebase.RTDB.setBool(&fbdo, "/servo/enabled", servoEnabled)) {
        Serial.println("Created '/servo/enabled' with default value true.");
      } else {
        Serial.println("Failed to create '/servo/enabled': " + fbdo.errorReason());
      }
    }

    if (Firebase.RTDB.getInt(&fbdo, "/servo/term")) {
      term = fbdo.intData();
      Serial.print("Term: ");
      Serial.println(term);
    } else {
      Serial.println("Servo term not found. Creating with default value.");
      term = 10000;
      if (Firebase.RTDB.setInt(&fbdo, "/servo/term", term)) {
        Serial.println("Created '/servo/term' with default value 10000.");
      } else {
        Serial.println("Failed to create '/servo/term': " + fbdo.errorReason());
      }
    }

    if (servoEnabled && millis() >= nextSpinTime) {
      Serial.println("Rotating servo...");
      nextSpinTime = millis() + term;

      if (!spinDirection) {
        for (int pos = 0; pos <= 180; pos++) {
          sg90.write(pos);
          delay(10);
        }
      } else {
        for (int pos = 180; pos >= 0; pos--) {
          sg90.write(pos);
          delay(10);
        }
      }
      spinDirection = !spinDirection;
      Serial.println("Servo rotation complete.");
    }

    FirebaseJson json;
    json.set("fields/lux/doubleValue", lux);
    json.set("fields/temperature/doubleValue", temperature);
    json.set("fields/humidity/doubleValue", humidity);
    json.set("fields/timestamp/timestampValue", timestampStr); 
    json.set("fields/ledState/booleanValue", ledState);
    json.set("fields/fanState/booleanValue", fanState);
    json.set("fields/mistState/booleanValue", mistState);
    json.set("fields/servoEnabled/booleanValue", servoEnabled);
    json.set("fields/term/integerValue", term);

    if (Firebase.Firestore.createDocument(&fbdoFirestore, projectID.c_str(), "", "SensorData", "", json.raw(), "")) {
      Serial.println("Data written to Firestore successfully");
    } else {
      Serial.println("Error writing to Firestore: " + fbdoFirestore.errorReason());
    }
  }

  delay(100); 
}