// Classic blink — LED on pin 13 (built-in)
#include <Arduino.h>  // Arduino UNO R4 (Renesas RA4M1) core

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}
