#include <Arduino.h>            // Arduino UNO R4 (Renesas RA4M1) core
#include <ArduinoGraphics.h>    // Text/graphics primitives for the matrix
#include <Arduino_LED_Matrix.h> // 12x8 LED matrix driver (WiFi variant)

ArduinoLEDMatrix matrix;

void showText(const char* text) {
  matrix.beginDraw();
  matrix.stroke(0xFFFFFFFF);
  matrix.textFont(Font_4x6);
  matrix.beginText(0, 1, 0xFFFFFF);
  matrix.println(text);
  matrix.endText();
  matrix.endDraw();
}

void setup() {
  matrix.begin();

  // Countdown 10 -> 1
  for (int i = 10; i >= 1; i--) {
    char buf[3];
    itoa(i, buf, 10);
    showText(buf);
    delay(1000);
  }

  // Flash "WIN" 5 times
  for (int f = 0; f < 5; f++) {
    showText("WIN");
    delay(400);
    matrix.clear();
    delay(200);
  }

  // Leave "WIN" on screen
  showText("WIN");
}

void loop() {
  // nothing — sequence runs once in setup
}
