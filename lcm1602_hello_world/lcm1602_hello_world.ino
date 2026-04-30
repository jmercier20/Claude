#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define BUTTON_PIN 7
#define LED_PIN    8

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);

  lcd.init();
  lcd.backlight();
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    digitalWrite(LED_PIN, HIGH);
    lcd.setCursor(0, 0);
    lcd.print("Hello World");
  } else {
    digitalWrite(LED_PIN, LOW);
    lcd.clear();
  }
}
