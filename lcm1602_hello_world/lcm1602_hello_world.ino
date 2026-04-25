#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// I2C address 0x27 (try 0x3F if display is blank)
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Hello World");
}

void loop() {
  // Nothing to do
}
