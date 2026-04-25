#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// LCD address 0x27, 16 columns, 2 rows (common 16x2 I2C LCD)
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.init();
  lcd.backlight();
}

void loop() {
  for (int i = 1; i <= 10; i++) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Count:");
    lcd.setCursor(0, 1);
    lcd.print(i);
    delay(1000);
  }

  // Pause before restarting the count
  delay(2000);
}
